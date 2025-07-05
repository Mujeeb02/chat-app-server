"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketHandlers = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../user/User");
const setupSocketHandlers = (io) => {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const user = await User_1.User.findById(decoded.userId).select('-password');
            if (!user) {
                return next(new Error('User not found'));
            }
            socket.data.userId = decoded.userId;
            socket.data.user = user.toObject();
            next();
        }
        catch (error) {
            next(new Error('Authentication error'));
        }
    });
    io.on('connection', (socket) => {
        console.log('User connected:', socket.data.userId);
        socket.join(`user:${socket.data.userId}`);
        User_1.User.findByIdAndUpdate(socket.data.userId, {
            isOnline: true,
            lastSeen: new Date()
        }).catch(err => console.error('Error updating user status:', err));
        socket.on('join-chat', (chatId) => {
            socket.join(`chat:${chatId}`);
            console.log(`User ${socket.data.userId} joined chat ${chatId}`);
        });
        socket.on('leave-chat', (chatId) => {
            socket.leave(`chat:${chatId}`);
            console.log(`User ${socket.data.userId} left chat ${chatId}`);
        });
        socket.on('send-message', async (data) => {
            try {
                const { chatId, content, type = 'text' } = data;
                io.to(`chat:${chatId}`).emit('new-message', {
                    chatId,
                    content,
                    type,
                    senderId: socket.data.userId,
                    sender: socket.data.user,
                    timestamp: new Date()
                });
            }
            catch (error) {
                console.error('Error handling message:', error);
            }
        });
        socket.on('typing-start', (chatId) => {
            socket.to(`chat:${chatId}`).emit('user-typing', {
                chatId,
                userId: socket.data.userId,
                username: socket.data.user.username
            });
        });
        socket.on('typing-stop', (chatId) => {
            socket.to(`chat:${chatId}`).emit('user-stop-typing', {
                chatId,
                userId: socket.data.userId
            });
        });
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.data.userId);
            User_1.User.findByIdAndUpdate(socket.data.userId, {
                isOnline: false,
                lastSeen: new Date()
            }).catch(err => console.error('Error updating user status:', err));
        });
    });
};
exports.setupSocketHandlers = setupSocketHandlers;
//# sourceMappingURL=socketHandler.js.map