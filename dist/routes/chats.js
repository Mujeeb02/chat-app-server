"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const Chat_1 = __importDefault(require("../models/Chat"));
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
router.get('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const chats = await Chat_1.default.find({ participants: req.user._id })
        .populate('participants', 'username firstName lastName avatar isOnline')
        .populate('lastMessage.senderId', 'username firstName lastName')
        .sort({ 'lastMessage.timestamp': -1 });
    res.json({ success: true, data: chats });
}));
router.post('/', [
    (0, express_validator_1.body)('name').isLength({ min: 1, max: 100 }).withMessage('Chat name is required'),
    (0, express_validator_1.body)('type').isIn(['direct', 'group']).withMessage('Invalid chat type'),
    (0, express_validator_1.body)('participants').isArray({ min: 1 }).withMessage('At least one participant required')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    const { name, type, participants, description } = req.body;
    const allParticipants = [...new Set([...participants, req.user._id])];
    const chat = new Chat_1.default({
        name,
        type,
        description,
        participants: allParticipants,
        admins: [req.user._id]
    });
    await chat.save();
    await chat.populate('participants', 'username firstName lastName avatar');
    res.status(201).json({ success: true, data: chat });
}));
router.get('/:chatId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const chat = await Chat_1.default.findById(req.params.chatId)
        .populate('participants', 'username firstName lastName avatar isOnline')
        .populate('admins', 'username firstName lastName');
    if (!chat) {
        return res.status(404).json({ success: false, error: 'Chat not found' });
    }
    if (!chat.participants.some(p => p._id.toString() === req.user._id)) {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }
    res.json({ success: true, data: chat });
}));
router.put('/:chatId', [
    (0, express_validator_1.body)('name').optional().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('description').optional().isLength({ max: 500 })
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    const chat = await Chat_1.default.findById(req.params.chatId);
    if (!chat) {
        return res.status(404).json({ success: false, error: 'Chat not found' });
    }
    if (!chat.admins.includes(req.user._id)) {
        return res.status(403).json({ success: false, error: 'Only admins can update chat' });
    }
    const { name, description } = req.body;
    const updateData = {};
    if (name)
        updateData.name = name;
    if (description !== undefined)
        updateData.description = description;
    const updatedChat = await Chat_1.default.findByIdAndUpdate(req.params.chatId, updateData, { new: true, runValidators: true }).populate('participants', 'username firstName lastName avatar');
    res.json({ success: true, data: updatedChat });
}));
router.post('/:chatId/participants', [
    (0, express_validator_1.body)('userId').notEmpty().withMessage('User ID is required')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    const chat = await Chat_1.default.findById(req.params.chatId);
    if (!chat) {
        return res.status(404).json({ success: false, error: 'Chat not found' });
    }
    if (!chat.admins.includes(req.user._id)) {
        return res.status(403).json({ success: false, error: 'Only admins can add participants' });
    }
    const { userId } = req.body;
    if (chat.participants.includes(userId)) {
        return res.status(400).json({ success: false, error: 'User is already a participant' });
    }
    chat.participants.push(userId);
    await chat.save();
    res.json({ success: true, message: 'Participant added successfully' });
}));
router.delete('/:chatId/participants/:userId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const chat = await Chat_1.default.findById(req.params.chatId);
    if (!chat) {
        return res.status(404).json({ success: false, error: 'Chat not found' });
    }
    if (!chat.admins.includes(req.user._id)) {
        return res.status(403).json({ success: false, error: 'Only admins can remove participants' });
    }
    const participantId = req.params.userId;
    chat.participants = chat.participants.filter(id => id.toString() !== participantId);
    chat.admins = chat.admins.filter(id => id.toString() !== participantId);
    await chat.save();
    res.json({ success: true, message: 'Participant removed successfully' });
}));
router.delete('/:chatId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const chat = await Chat_1.default.findById(req.params.chatId);
    if (!chat) {
        return res.status(404).json({ success: false, error: 'Chat not found' });
    }
    if (!chat.admins.includes(req.user._id)) {
        return res.status(403).json({ success: false, error: 'Only admins can delete chat' });
    }
    await Chat_1.default.findByIdAndDelete(req.params.chatId);
    res.json({ success: true, message: 'Chat deleted successfully' });
}));
exports.default = router;
//# sourceMappingURL=chats.js.map