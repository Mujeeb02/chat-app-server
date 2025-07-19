"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
dotenv_1.default.config();
const mainRoutes_1 = __importDefault(require("./mainRoutes"));
const auth_routes_1 = __importDefault(require("./auth/auth.routes"));
const User_1 = require("./user/User");
const chat_model_1 = __importDefault(require("./chat/chat.model"));
const message_model_1 = __importDefault(require("./message/message.model"));
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: ['https://chat-app-pied-gamma.vercel.app', 'http://localhost:3000', '*'],
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});
mongoose_1.default.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
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
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use((0, cors_1.default)({
    origin: ['https://chat-app-pied-gamma.vercel.app', 'http://localhost:3000', '*'],
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/auth', auth_routes_1.default);
app.use('/api', mainRoutes_1.default);
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: '1.0.0'
    });
});
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        if (!token) {
            return next(new Error('Authentication error'));
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await User_1.User.findById(decoded.userId).select('-password');
        if (!user) {
            return next(new Error('User not found'));
        }
        socket.userId = user._id.toString();
        socket.user = user.toObject();
        next();
    }
    catch (error) {
        next(new Error('Authentication error'));
    }
});
io.on('connection', async (socket) => {
    console.log('User connected:', socket.userId);
    if (socket.userId) {
        await User_1.User.findByIdAndUpdate(socket.userId, {
            status: 'online',
            lastSeen: new Date()
        });
    }
    if (socket.userId) {
        const userChats = await chat_model_1.default.find({ participants: socket.userId });
        userChats.forEach(chat => {
            socket.join(`chat:${chat._id}`);
        });
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
        socket.join(`user:${socket.userId}`);
        console.log(`User ${socket.userId} joined personal room: user:${socket.userId}`);
        const userRooms = Array.from(socket.rooms);
        console.log(`User ${socket.userId} is in rooms:`, userRooms);
    }
    socket.on('typing:start', async (data) => {
        const { chatId } = data;
        if (!socket.userId)
            return;
        const chat = await chat_model_1.default.findOne({
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
        if (!socket.userId)
            return;
        const chat = await chat_model_1.default.findOne({
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
    socket.on('message:send', async (data) => {
        try {
            const { chatId, content, type = 'text', replyTo, mediaUrl, mediaType, mediaSize, fileName } = data;
            console.log('Socket message received:', { chatId, content, type, mediaUrl, fileName });
            if (!socket.userId)
                return;
            const chat = await chat_model_1.default.findOne({
                _id: chatId,
                participants: socket.userId
            });
            if (!chat) {
                socket.emit('message:error', { message: 'Chat not found' });
                return;
            }
            let messageContent = content;
            if (['image', 'video', 'audio', 'file'].includes(type) && !content && mediaUrl) {
                messageContent = mediaUrl;
            }
            const messageData = {
                content: messageContent,
                type,
                sender: socket.userId,
                chatId
            };
            if (replyTo)
                messageData.replyTo = replyTo;
            if (mediaUrl)
                messageData.mediaUrl = mediaUrl;
            if (mediaType)
                messageData.mediaType = mediaType;
            if (mediaSize)
                messageData.mediaSize = mediaSize;
            if (fileName)
                messageData.fileName = fileName;
            console.log('Creating socket message with data:', messageData);
            const message = new message_model_1.default(messageData);
            await message.save();
            chat.lastMessage = message._id;
            await chat.save();
            const populatedMessage = await message_model_1.default.findById(message._id)
                .populate('sender', 'username firstName lastName avatar')
                .populate('replyTo', 'content sender')
                .populate('reactions.user', 'username firstName lastName avatar');
            socket.to(`chat:${chatId}`).emit('message:new', {
                message: populatedMessage,
                chatId
            });
            socket.emit('message:sent', {
                message: populatedMessage,
                chatId
            });
            chat.participants.forEach(participantId => {
                if (participantId.toString() !== socket.userId) {
                    chat.updateUnreadCount(participantId.toString(), true);
                }
            });
            await chat.save();
        }
        catch (error) {
            console.error('Message send error:', error);
            socket.emit('message:error', { message: 'Failed to send message' });
        }
    });
    socket.on('message:read', async (data) => {
        const { messageId, chatId } = data;
        if (!socket.userId)
            return;
        try {
            await message_model_1.default.findByIdAndUpdate(messageId, {
                $addToSet: { seenBy: socket.userId }
            });
            const chat = await chat_model_1.default.findById(chatId);
            if (chat) {
                chat.resetUnreadCount(socket.userId);
                await chat.save();
            }
            socket.to(`chat:${chatId}`).emit('message:read', {
                messageId,
                userId: socket.userId,
                chatId
            });
        }
        catch (error) {
            console.error('Message read error:', error);
        }
    });
    socket.on('message:react', async (data) => {
        const { messageId, reaction, chatId } = data;
        if (!socket.userId)
            return;
        try {
            console.log('Reaction received:', { messageId, reaction, userId: socket.userId, chatId });
            const chat = await chat_model_1.default.findOne({
                _id: chatId,
                participants: socket.userId
            });
            if (!chat) {
                console.log('Chat not found for reaction');
                socket.emit('message:error', { message: 'Chat not found' });
                return;
            }
            const message = await message_model_1.default.findById(messageId);
            if (!message) {
                console.log('Message not found for reaction');
                socket.emit('message:error', { message: 'Message not found' });
                return;
            }
            console.log('Adding reaction to message:', messageId);
            const reactionAdded = message.addReaction(socket.userId, reaction);
            await message.save();
            if (reactionAdded) {
                console.log('Reaction added successfully, broadcasting to chat:', chatId);
                const populatedMessage = await message_model_1.default.findById(messageId)
                    .populate('sender', 'username firstName lastName avatar')
                    .populate('reactions.user', 'username firstName lastName avatar');
                socket.to(`chat:${chatId}`).emit('message:reaction', {
                    messageId,
                    reaction: {
                        emoji: reaction,
                        user: socket.user,
                        createdAt: new Date()
                    },
                    chatId
                });
                socket.emit('message:reaction:sent', {
                    messageId,
                    reaction: {
                        emoji: reaction,
                        user: socket.user,
                        createdAt: new Date()
                    },
                    chatId
                });
            }
            else {
                console.log('Reaction already exists');
            }
        }
        catch (error) {
            console.error('Message reaction error:', error);
            socket.emit('message:error', { message: 'Failed to add reaction' });
        }
    });
    socket.on('message:remove-reaction', async (data) => {
        const { messageId, reaction, chatId } = data;
        if (!socket.userId)
            return;
        try {
            console.log('Reaction removal received:', { messageId, reaction, userId: socket.userId });
            const chat = await chat_model_1.default.findOne({
                _id: chatId,
                participants: socket.userId
            });
            if (!chat) {
                socket.emit('message:error', { message: 'Chat not found' });
                return;
            }
            const message = await message_model_1.default.findById(messageId);
            if (!message) {
                socket.emit('message:error', { message: 'Message not found' });
                return;
            }
            const reactionRemoved = message.removeReaction(socket.userId, reaction);
            await message.save();
            if (reactionRemoved) {
                const populatedMessage = await message_model_1.default.findById(messageId)
                    .populate('sender', 'username firstName lastName avatar')
                    .populate('reactions.user', 'username firstName lastName avatar');
                socket.to(`chat:${chatId}`).emit('message:reaction-removed', {
                    messageId,
                    emoji: reaction,
                    userId: socket.userId,
                    chatId
                });
                socket.emit('message:reaction-removed:sent', {
                    messageId,
                    emoji: reaction,
                    userId: socket.userId,
                    chatId
                });
            }
        }
        catch (error) {
            console.error('Message reaction removal error:', error);
            socket.emit('message:error', { message: 'Failed to remove reaction' });
        }
    });
    socket.on('chat:join', async (chatId) => {
        if (!socket.userId)
            return;
        const chat = await chat_model_1.default.findOne({
            _id: chatId,
            participants: socket.userId
        });
        if (chat) {
            socket.join(`chat:${chatId}`);
            socket.emit('chat:joined', { chatId });
        }
    });
    socket.on('chat:leave', (chatId) => {
        socket.leave(`chat:${chatId}`);
        socket.emit('chat:left', { chatId });
    });
    socket.on('call:start', async (data) => {
        const { chatId, offer, isVideo } = data;
        if (!socket.userId)
            return;
        console.log('Call start request:', { chatId, isVideo, userId: socket.userId });
        const chat = await chat_model_1.default.findOne({
            _id: chatId,
            participants: socket.userId
        });
        if (!chat) {
            socket.emit('call:error', { message: 'Chat not found' });
            return;
        }
        const otherParticipants = chat.participants.filter(participantId => participantId.toString() !== socket.userId);
        console.log('Sending call to participants:', otherParticipants);
        otherParticipants.forEach(participantId => {
            console.log(`Sending call to user room: user:${participantId}`);
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
    socket.on('call:accept', async (data) => {
        const { chatId, answer } = data;
        if (!socket.userId)
            return;
        console.log('Call accept request:', { chatId, userId: socket.userId });
        const chat = await chat_model_1.default.findOne({
            _id: chatId,
            participants: socket.userId
        });
        if (!chat) {
            socket.emit('call:error', { message: 'Chat not found' });
            return;
        }
        socket.to(`chat:${chatId}`).emit('call:accepted', {
            chatId,
            answer,
            userId: socket.userId
        });
    });
    socket.on('call:answer', async (data) => {
        const { chatId, answer } = data;
        if (!socket.userId)
            return;
        console.log('Call answer received:', { chatId, userId: socket.userId });
        const chat = await chat_model_1.default.findOne({
            _id: chatId,
            participants: socket.userId
        });
        if (!chat) {
            socket.emit('call:error', { message: 'Chat not found' });
            return;
        }
        socket.to(`chat:${chatId}`).emit('call:answer', {
            chatId,
            answer,
            userId: socket.userId
        });
    });
    socket.on('call:reject', async (data) => {
        const { chatId } = data;
        if (!socket.userId)
            return;
        console.log('Call reject request:', { chatId, userId: socket.userId });
        const chat = await chat_model_1.default.findOne({
            _id: chatId,
            participants: socket.userId
        });
        if (!chat) {
            socket.emit('call:error', { message: 'Chat not found' });
            return;
        }
        socket.to(`chat:${chatId}`).emit('call:rejected', {
            chatId,
            userId: socket.userId
        });
    });
    socket.on('call:end', async (data) => {
        const { chatId } = data;
        if (!socket.userId)
            return;
        console.log('Call end request:', { chatId, userId: socket.userId });
        const chat = await chat_model_1.default.findOne({
            _id: chatId,
            participants: socket.userId
        });
        if (!chat) {
            socket.emit('call:error', { message: 'Chat not found' });
            return;
        }
        socket.to(`chat:${chatId}`).emit('call:ended', {
            chatId,
            userId: socket.userId
        });
    });
    socket.on('call:ice-candidate', async (data) => {
        const { chatId, candidate } = data;
        if (!socket.userId)
            return;
        const chat = await chat_model_1.default.findOne({
            _id: chatId,
            participants: socket.userId
        });
        if (!chat) {
            socket.emit('call:error', { message: 'Chat not found' });
            return;
        }
        socket.to(`chat:${chatId}`).emit('call:ice-candidate', {
            chatId,
            candidate,
            userId: socket.userId
        });
    });
    socket.on('disconnect', async () => {
        console.log('User disconnected:', socket.userId);
        if (socket.userId) {
            await User_1.User.findByIdAndUpdate(socket.userId, {
                status: 'offline',
                lastSeen: new Date()
            });
            const userChats = await chat_model_1.default.find({ participants: socket.userId });
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
        socket.on('test:incoming-call', async (data) => {
            const { targetUserId, chatId } = data;
            if (!socket.userId)
                return;
            console.log('Test: Manually triggering incoming call to user:', targetUserId);
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
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
    console.log(`🏥 Health check at http://localhost:${PORT}/health`);
    console.log(`🔌 Socket.IO server ready`);
});
exports.default = app;
//# sourceMappingURL=index.js.map