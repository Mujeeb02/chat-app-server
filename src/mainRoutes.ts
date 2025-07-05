import express from 'express';
import userRoutes from './user/user.routes';
import chatRoutes from './chat/chat.routes';
import messageRoutes from './message/message.routes';
import uploadRoutes from './upload/upload.routes';

const router = express.Router();

// Mount module routes
router.use('/users', userRoutes);
router.use('/chats', chatRoutes);
router.use('/messages', messageRoutes);
router.use('/upload', uploadRoutes);

export default router; 