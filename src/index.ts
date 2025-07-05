import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

// Import modular routes
import modulesRoutes from './mainRoutes';
import authRoutes from './auth/auth.routes';
import { User } from './user/User';
import Chat from './chat/chat.model';
import Message from './message/message.model';

// Extend Socket interface to include user data
declare module 'socket.io' {
  interface Socket {
    userId?: string;
    user?: any;
  }
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['https://chat-app-pied-gamma.vercel.app','http://localhost:3000','*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

console.log('Environment validation passed');
console.log('Cloudinary config:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? '***' : 'missing',
  api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : 'missing'
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: ['https://chat-app-pied-gamma.vercel.app','http://localhost:3000','*'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', modulesRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user:any = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user.toObject();
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling
io.on('connection', async (socket) => {
  console.log('User connected:', socket.userId);

  // Update user status to online
  if (socket.userId) {
    await User.findByIdAndUpdate(socket.userId, {
      status: 'online',
      lastSeen: new Date()
    });
  }

  // Join user to their chat rooms
  if (socket.userId) {
    const userChats = await Chat.find({ participants: socket.userId });
    userChats.forEach(chat => {
      socket.join(`chat:${chat._id}`);
    });

    // Broadcast user online status to all their contacts
    const onlineUsers = new Set();
    userChats.forEach(chat => {
      chat.participants.forEach(participantId => {
        if (participantId.toString() !== socket.userId) {
          onlineUsers.add(participantId.toString());
        }
      });
    });

    onlineUsers.forEach(userId => {
      socket.to(`user:${userId}`).emit('user:status', {
        userId: socket.userId,
        status: 'online',
        lastSeen: new Date()
      });
    });

    // Join user's personal room for direct messages
    socket.join(`user:${socket.userId}`);
    console.log(`User ${socket.userId} joined personal room: user:${socket.userId}`);
    
    // Log all rooms this user is in
    const userRooms = Array.from(socket.rooms);
    console.log(`User ${socket.userId} is in rooms:`, userRooms);
  }

  // Handle typing events
  socket.on('typing:start', async (data) => {
    const { chatId } = data;
    
    if (!socket.userId) return;
    
    // Verify user is participant of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: socket.userId
    });

    if (chat) {
      socket.to(`chat:${chatId}`).emit('typing:start', {
        chatId,
        userId: socket.userId,
        userName: socket.user?.firstName
      });
    }
  });

  socket.on('typing:stop', async (data) => {
    const { chatId } = data;
    
    if (!socket.userId) return;
    
    const chat = await Chat.findOne({
      _id: chatId,
      participants: socket.userId
    });

    if (chat) {
      socket.to(`chat:${chatId}`).emit('typing:stop', {
        chatId,
        userId: socket.userId
      });
    }
  });

  // Handle new message
  socket.on('message:send', async (data) => {
    try {
      const { chatId, content, type = 'text', replyTo, mediaUrl, mediaType, mediaSize, fileName } = data;
      
      console.log('Socket message received:', { chatId, content, type, mediaUrl, fileName });
      
      if (!socket.userId) return;
      
      // Verify user is participant of the chat
      const chat = await Chat.findOne({
        _id: chatId,
        participants: socket.userId
      });

      if (!chat) {
        socket.emit('message:error', { message: 'Chat not found' });
        return;
      }

      // For media types, use mediaUrl as content if no content is provided
      let messageContent = content;
      if (['image', 'video', 'audio', 'file'].includes(type) && !content && mediaUrl) {
        messageContent = mediaUrl;
      }

      // Create message
      const messageData: any = {
        content: messageContent,
        type,
        sender: socket.userId,
        chatId
      };

      if (replyTo) messageData.replyTo = replyTo;
      if (mediaUrl) messageData.mediaUrl = mediaUrl;
      if (mediaType) messageData.mediaType = mediaType;
      if (mediaSize) messageData.mediaSize = mediaSize;
      if (fileName) messageData.fileName = fileName;

      console.log('Creating socket message with data:', messageData);

      const message = new Message(messageData);
      await message.save();

      // Update chat's last message
      chat.lastMessage = message._id as mongoose.Types.ObjectId;
      await chat.save();

      // Populate message with sender info
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'username firstName lastName avatar')
        .populate('replyTo', 'content sender')
        .populate('reactions.user', 'username firstName lastName avatar');

      // Broadcast message to all participants in the chat
      socket.to(`chat:${chatId}`).emit('message:new', {
        message: populatedMessage,
        chatId
      });

      // Send confirmation to sender
      socket.emit('message:sent', {
        message: populatedMessage,
        chatId
      });

      // Update unread count for other participants
      chat.participants.forEach(participantId => {
        if (participantId.toString() !== socket.userId) {
          chat.updateUnreadCount(participantId.toString(), true);
        }
      });
      await chat.save();

    } catch (error) {
      console.error('Message send error:', error);
      socket.emit('message:error', { message: 'Failed to send message' });
    }
  });

  // Handle message read
  socket.on('message:read', async (data) => {
    const { messageId, chatId } = data;
    
    if (!socket.userId) return;
    
    try {
      await Message.findByIdAndUpdate(messageId, {
        $addToSet: { seenBy: socket.userId }
      });

      // Reset unread count for this user in this chat
      const chat = await Chat.findById(chatId);
      if (chat) {
        chat.resetUnreadCount(socket.userId);
        await chat.save();
      }

      socket.to(`chat:${chatId}`).emit('message:read', {
        messageId,
        userId: socket.userId,
        chatId
      });
    } catch (error) {
      console.error('Message read error:', error);
    }
  });

  // Handle message reaction
  socket.on('message:react', async (data) => {
    const { messageId, reaction, chatId } = data;
    
    if (!socket.userId) return;
    
    try {
      console.log('Reaction received:', { messageId, reaction, userId: socket.userId, chatId });
      
      // Verify user is participant of the chat
      const chat = await Chat.findOne({
        _id: chatId,
        participants: socket.userId
      });

      if (!chat) {
        console.log('Chat not found for reaction');
        socket.emit('message:error', { message: 'Chat not found' });
        return;
      }

      // Find the message
      const message = await Message.findById(messageId);
      if (!message) {
        console.log('Message not found for reaction');
        socket.emit('message:error', { message: 'Message not found' });
        return;
      }

      console.log('Adding reaction to message:', messageId);
      // Add reaction
      const reactionAdded = (message as any).addReaction(socket.userId, reaction);
      await message.save();

      if (reactionAdded) {
        console.log('Reaction added successfully, broadcasting to chat:', chatId);
        // Populate message with reactions
        const populatedMessage = await Message.findById(messageId)
          .populate('sender', 'username firstName lastName avatar')
          .populate('reactions.user', 'username firstName lastName avatar');

        // Broadcast reaction to all participants in the chat
        socket.to(`chat:${chatId}`).emit('message:reaction', {
          messageId,
          reaction: {
            emoji: reaction,
            user: socket.user,
            createdAt: new Date()
          },
          chatId
        });

        // Send confirmation to sender
        socket.emit('message:reaction:sent', {
          messageId,
          reaction: {
            emoji: reaction,
            user: socket.user,
            createdAt: new Date()
          },
          chatId
        });
      } else {
        console.log('Reaction already exists');
      }
    } catch (error) {
      console.error('Message reaction error:', error);
      socket.emit('message:error', { message: 'Failed to add reaction' });
    }
  });

  // Handle reaction removal
  socket.on('message:remove-reaction', async (data) => {
    const { messageId, reaction, chatId } = data;
    
    if (!socket.userId) return;
    
    try {
      console.log('Reaction removal received:', { messageId, reaction, userId: socket.userId });
      
      // Verify user is participant of the chat
      const chat = await Chat.findOne({
        _id: chatId,
        participants: socket.userId
      });

      if (!chat) {
        socket.emit('message:error', { message: 'Chat not found' });
        return;
      }

      // Find the message
      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit('message:error', { message: 'Message not found' });
        return;
      }

      // Remove reaction
      const reactionRemoved = (message as any).removeReaction(socket.userId, reaction);
      await message.save();

      if (reactionRemoved) {
        // Populate message with reactions
        const populatedMessage = await Message.findById(messageId)
          .populate('sender', 'username firstName lastName avatar')
          .populate('reactions.user', 'username firstName lastName avatar');

        // Broadcast reaction removal to all participants in the chat
        socket.to(`chat:${chatId}`).emit('message:reaction-removed', {
          messageId,
          emoji: reaction,
          userId: socket.userId,
          chatId
        });

        // Send confirmation to sender
        socket.emit('message:reaction-removed:sent', {
          messageId,
          emoji: reaction,
          userId: socket.userId,
          chatId
        });
      }
    } catch (error) {
      console.error('Message reaction removal error:', error);
      socket.emit('message:error', { message: 'Failed to remove reaction' });
    }
  });

  // Handle user joining a new chat
  socket.on('chat:join', async (chatId) => {
    if (!socket.userId) return;
    
    const chat = await Chat.findOne({
      _id: chatId,
      participants: socket.userId
    });

    if (chat) {
      socket.join(`chat:${chatId}`);
      socket.emit('chat:joined', { chatId });
    }
  });

  // Handle user leaving a chat
  socket.on('chat:leave', (chatId) => {
    socket.leave(`chat:${chatId}`);
    socket.emit('chat:left', { chatId });
  });

  // Handle call start
  socket.on('call:start', async (data) => {
    const { chatId, offer, isVideo } = data;
    
    if (!socket.userId) return;
    
    console.log('Call start request:', { chatId, isVideo, userId: socket.userId });
    
    // Verify user is participant of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: socket.userId
    });

    if (!chat) {
      socket.emit('call:error', { message: 'Chat not found' });
      return;
    }

    // Get other participants
    const otherParticipants = chat.participants.filter(
      participantId => participantId.toString() !== socket.userId
    );

    console.log('Sending call to participants:', otherParticipants);

    // Send call offer to other participants
    otherParticipants.forEach(participantId => {
      console.log(`Sending call to user room: user:${participantId}`);
      
      // Check if the user is in the room
      const roomName = `user:${participantId}`;
      const room = io.sockets.adapter.rooms.get(roomName);
      const userCount = room ? room.size : 0;
      console.log(`Room ${roomName} has ${userCount} users`);
      
      socket.to(`user:${participantId}`).emit('call:incoming', {
        chatId,
        offer,
        isVideo,
        caller: socket.user
      });
    });
  });

  // Handle call accept
  socket.on('call:accept', async (data) => {
    const { chatId, answer } = data;
    
    if (!socket.userId) return;
    
    console.log('Call accept request:', { chatId, userId: socket.userId });
    
    // Verify user is participant of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: socket.userId
    });

    if (!chat) {
      socket.emit('call:error', { message: 'Chat not found' });
      return;
    }

    // Send call answer to other participants
    socket.to(`chat:${chatId}`).emit('call:accepted', {
      chatId,
      answer,
      userId: socket.userId
    });
  });

  // Handle call answer (new event for WebRTC answer)
  socket.on('call:answer', async (data) => {
    const { chatId, answer } = data;
    
    if (!socket.userId) return;
    
    console.log('Call answer received:', { chatId, userId: socket.userId });
    
    // Verify user is participant of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: socket.userId
    });

    if (!chat) {
      socket.emit('call:error', { message: 'Chat not found' });
      return;
    }

    // Send call answer to other participants
    socket.to(`chat:${chatId}`).emit('call:answer', {
      chatId,
      answer,
      userId: socket.userId
    });
  });

  // Handle call reject
  socket.on('call:reject', async (data) => {
    const { chatId } = data;
    
    if (!socket.userId) return;
    
    console.log('Call reject request:', { chatId, userId: socket.userId });
    
    // Verify user is participant of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: socket.userId
    });

    if (!chat) {
      socket.emit('call:error', { message: 'Chat not found' });
      return;
    }

    // Send call rejection to other participants
    socket.to(`chat:${chatId}`).emit('call:rejected', {
      chatId,
      userId: socket.userId
    });
  });

  // Handle call end
  socket.on('call:end', async (data) => {
    const { chatId } = data;
    
    if (!socket.userId) return;
    
    console.log('Call end request:', { chatId, userId: socket.userId });
    
    // Verify user is participant of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: socket.userId
    });

    if (!chat) {
      socket.emit('call:error', { message: 'Chat not found' });
      return;
    }

    // Send call end to other participants
    socket.to(`chat:${chatId}`).emit('call:ended', {
      chatId,
      userId: socket.userId
    });
  });

  // Handle ICE candidate
  socket.on('call:ice-candidate', async (data) => {
    const { chatId, candidate } = data;
    
    if (!socket.userId) return;
    
    // Verify user is participant of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: socket.userId
    });

    if (!chat) {
      socket.emit('call:error', { message: 'Chat not found' });
      return;
    }

    // Forward ICE candidate to other participants
    socket.to(`chat:${chatId}`).emit('call:ice-candidate', {
      chatId,
      candidate,
      userId: socket.userId
    });
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.userId);

    if (socket.userId) {
      // Update user status to offline
      await User.findByIdAndUpdate(socket.userId, {
        status: 'offline',
        lastSeen: new Date()
      });

      // Broadcast user offline status to all their contacts
      const userChats = await Chat.find({ participants: socket.userId });
      const onlineUsers = new Set();
      userChats.forEach(chat => {
        chat.participants.forEach(participantId => {
          if (participantId.toString() !== socket.userId) {
            onlineUsers.add(participantId.toString());
          }
        });
      });

      onlineUsers.forEach(userId => {
        socket.to(`user:${userId}`).emit('user:status', {
          userId: socket.userId,
          status: 'offline',
          lastSeen: new Date()
        });
      });
    }

    // Test endpoint to manually trigger incoming call
    socket.on('test:incoming-call', async (data) => {
      const { targetUserId, chatId } = data;
      
      if (!socket.userId) return;
      
      console.log('Test: Manually triggering incoming call to user:', targetUserId);
      
      // Send test call to target user
      socket.to(`user:${targetUserId}`).emit('call:incoming', {
        chatId,
        offer: {
          type: 'offer',
          sdp: 'test-sdp'
        },
        isVideo: true,
        caller: socket.user
      });
    });
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🏥 Health check at http://localhost:${PORT}/health`);
  console.log(`🔌 Socket.IO server ready`);
});

export default app; 