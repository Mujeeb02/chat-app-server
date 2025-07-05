"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const Message_1 = __importDefault(require("../models/Message"));
const Chat_1 = __importDefault(require("../models/Chat"));
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
router.get('/:chatId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const chat = await Chat_1.default.findById(chatId);
    if (!chat || !chat.participants.includes(req.user._id)) {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }
    const messages = await Message_1.default.find({ chatId, isDeleted: false })
        .populate('senderId', 'username firstName lastName avatar')
        .populate('replyTo', 'content senderId')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
    const total = await Message_1.default.countDocuments({ chatId, isDeleted: false });
    res.json({
        success: true,
        data: messages.reverse(),
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
}));
router.post('/', [
    (0, express_validator_1.body)('chatId').notEmpty().withMessage('Chat ID is required'),
    (0, express_validator_1.body)('content').notEmpty().withMessage('Message content is required'),
    (0, express_validator_1.body)('type').optional().isIn(['text', 'image', 'video', 'audio', 'file', 'gif'])
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    const { chatId, content, type = 'text', fileUrl, fileName, fileSize, replyTo } = req.body;
    const chat = await Chat_1.default.findById(chatId);
    if (!chat || !chat.participants.includes(req.user._id)) {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }
    const message = new Message_1.default({
        chatId,
        senderId: req.user._id,
        content,
        type,
        fileUrl,
        fileName,
        fileSize,
        replyTo
    });
    await message.save();
    await message.populate('senderId', 'username firstName lastName avatar');
    res.status(201).json({ success: true, data: message });
}));
router.put('/:messageId', [
    (0, express_validator_1.body)('content').notEmpty().withMessage('Message content is required')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    const { content } = req.body;
    const message = await Message_1.default.findById(req.params.messageId);
    if (!message) {
        return res.status(404).json({ success: false, error: 'Message not found' });
    }
    if (message.senderId.toString() !== req.user._id) {
        return res.status(403).json({ success: false, error: 'You can only edit your own messages' });
    }
    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();
    res.json({ success: true, data: message });
}));
router.delete('/:messageId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const message = await Message_1.default.findById(req.params.messageId);
    if (!message) {
        return res.status(404).json({ success: false, error: 'Message not found' });
    }
    if (message.senderId.toString() !== req.user._id) {
        return res.status(403).json({ success: false, error: 'You can only delete your own messages' });
    }
    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();
    res.json({ success: true, message: 'Message deleted successfully' });
}));
router.post('/:messageId/reactions', [
    (0, express_validator_1.body)('reaction').notEmpty().withMessage('Reaction is required')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    const { reaction } = req.body;
    const message = await Message_1.default.findById(req.params.messageId);
    if (!message) {
        return res.status(404).json({ success: false, error: 'Message not found' });
    }
    if (reaction === 'remove') {
        message.removeReaction(req.user._id);
    }
    else {
        message.addReaction(req.user._id, reaction);
    }
    await message.save();
    res.json({ success: true, data: message.getReactionsCount() });
}));
exports.default = router;
//# sourceMappingURL=messages.js.map