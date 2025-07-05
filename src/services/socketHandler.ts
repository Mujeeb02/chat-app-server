import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import {User} from '../user/User';

interface JWTPayload {
  userId: string;
  iat: number;
  exp: number;
}

export const setupSocketHandlers = (io: Server) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.userId = decoded.userId;
      socket.data.user = user.toObject();
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.data.userId);

    // Join user's personal room
    socket.join(`user:${socket.data.userId}`);

    // Update user's online status
    User.findByIdAndUpdate(socket.data.userId, {
      isOnline: true,
      lastSeen: new Date()
    }).catch(err => console.error('Error updating user status:', err));

    // Join chat rooms
    socket.on('join-chat', (chatId: string) => {
      socket.join(`chat:${chatId}`);
      console.log(`User ${socket.data.userId} joined chat ${chatId}`);
    });

    // Leave chat rooms
    socket.on('leave-chat', (chatId: string) => {
      socket.leave(`chat:${chatId}`);
      console.log(`User ${socket.data.userId} left chat ${chatId}`);
    });

    // Handle new message
    socket.on('send-message', async (data) => {
      try {
        const { chatId, content, type = 'text' } = data;
        
        // Emit to all users in the chat
        io.to(`chat:${chatId}`).emit('new-message', {
          chatId,
          content,
          type,
          senderId: socket.data.userId,
          sender: socket.data.user,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });

    // Handle typing indicator
    socket.on('typing-start', (chatId: string) => {
      socket.to(`chat:${chatId}`).emit('user-typing', {
        chatId,
        userId: socket.data.userId,
        username: socket.data.user.username
      });
    });

    socket.on('typing-stop', (chatId: string) => {
      socket.to(`chat:${chatId}`).emit('user-stop-typing', {
        chatId,
        userId: socket.data.userId
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.data.userId);
      
      // Update user's offline status
      User.findByIdAndUpdate(socket.data.userId, {
        isOnline: false,
        lastSeen: new Date()
      }).catch(err => console.error('Error updating user status:', err));
    });
  });
}; 