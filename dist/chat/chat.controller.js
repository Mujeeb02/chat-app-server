"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinByInvite = exports.generateInviteLink = exports.togglePin = exports.toggleMute = exports.removeAdmin = exports.addAdmin = exports.removeParticipant = exports.addParticipant = exports.deleteChat = exports.updateChat = exports.getChat = exports.getChats = exports.createChat = void 0;
const chat_model_1 = __importDefault(require("./chat.model"));
const User_1 = require("../user/User");
const message_model_1 = __importDefault(require("../message/message.model"));
const errorHandler_1 = require("../middleware/errorHandler");
const uuid_1 = require("uuid");
const mongoose_1 = __importDefault(require("mongoose"));
exports.createChat = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { name, type, participants, description } = req.body;
    const currentUserId = req.user._id;
    console.log(req.body);
    if (!participants || participants.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'At least one participant is required'
        });
    }
    const allParticipants = participants.includes(currentUserId.toString())
        ? participants
        : [...participants, currentUserId.toString()];
    if (type === 'direct' && allParticipants.length !== 2) {
        return res.status(400).json({
            success: false,
            message: 'Direct chats must have exactly 2 participants'
        });
    }
    if (type === 'group' && allParticipants.length < 2) {
        return res.status(400).json({
            success: false,
            message: 'Group chats must have at least 2 participants'
        });
    }
    if (type === 'direct') {
        const existingChat = await chat_model_1.default.findOne({
            type: 'direct',
            participants: { $all: allParticipants, $size: 2 }
        }).populate('participants', 'username firstName lastName avatar');
        if (existingChat) {
            return res.status(200).json({
                success: true,
                message: 'Direct chat already exists',
                data: existingChat
            });
        }
    }
    const participantUsers = await User_1.User.find({
        _id: { $in: allParticipants }
    });
    if (participantUsers.length !== allParticipants.length) {
        return res.status(400).json({
            success: false,
            message: 'One or more participants not found'
        });
    }
    const chatData = {
        type,
        participants: allParticipants,
        admins: [currentUserId]
    };
    if (type === 'group') {
        chatData.name = name;
        chatData.description = description || '';
    }
    else {
        const otherParticipantId = allParticipants.find((id) => id !== currentUserId.toString());
        const otherParticipant = participantUsers.find((user) => user._id.toString() === otherParticipantId);
        if (otherParticipant) {
            chatData.name = `${otherParticipant.firstName} ${otherParticipant.lastName}`;
        }
    }
    const chat = new chat_model_1.default(chatData);
    await chat.save();
    const populatedChat = await chat_model_1.default.findById(chat._id)
        .populate('participants', 'username firstName lastName avatar email status lastSeen')
        .populate('admins', 'username firstName lastName avatar');
    return res.status(201).json({
        success: true,
        message: 'Chat created successfully',
        data: populatedChat
    });
});
exports.getChats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const currentUserId = req.user._id;
    const { page = 1, limit = 20, type, search } = req.query;
    const query = {
        participants: currentUserId
    };
    if (type) {
        query.type = type;
    }
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const chats = await chat_model_1.default.find(query)
        .populate('participants', 'username firstName lastName avatar email status lastSeen')
        .populate('admins', 'username firstName lastName avatar')
        .populate('lastMessage')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit));
    const total = await chat_model_1.default.countDocuments(query);
    res.json({
        success: true,
        data: chats,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
        }
    });
});
exports.getChat = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { chatId } = req.params;
    const currentUserId = req.user._id;
    const chat = await chat_model_1.default.findOne({
        _id: chatId,
        participants: currentUserId
    })
        .populate('participants', 'username firstName lastName avatar email status lastSeen')
        .populate('admins', 'username firstName lastName avatar')
        .populate('lastMessage')
        .populate('pinnedMessages');
    if (!chat) {
        return res.status(404).json({
            success: false,
            message: 'Chat not found'
        });
    }
    return res.json({
        success: true,
        data: chat
    });
});
exports.updateChat = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { chatId } = req.params;
    const { name, description, avatar, settings } = req.body;
    const currentUserId = req.user._id;
    const chat = await chat_model_1.default.findOne({
        _id: chatId,
        participants: currentUserId
    });
    if (!chat) {
        return res.status(404).json({
            success: false,
            message: 'Chat not found'
        });
    }
    if (!chat.canEditInfo(currentUserId.toString())) {
        return res.status(403).json({
            success: false,
            message: 'You do not have permission to edit this chat'
        });
    }
    const updateData = {};
    if (name !== undefined)
        updateData.name = name;
    if (description !== undefined)
        updateData.description = description;
    if (avatar !== undefined)
        updateData.avatar = avatar;
    if (settings !== undefined)
        updateData.settings = { ...chat.settings, ...settings };
    const updatedChat = await chat_model_1.default.findByIdAndUpdate(chatId, updateData, { new: true, runValidators: true })
        .populate('participants', 'username firstName lastName avatar email status lastSeen')
        .populate('admins', 'username firstName lastName avatar');
    return res.json({
        success: true,
        message: 'Chat updated successfully',
        data: updatedChat
    });
});
exports.deleteChat = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { chatId } = req.params;
    const currentUserId = req.user._id;
    const chat = await chat_model_1.default.findOne({
        _id: chatId,
        participants: currentUserId
    });
    if (!chat) {
        return res.status(404).json({
            success: false,
            message: 'Chat not found'
        });
    }
    if (!chat.isAdmin(currentUserId.toString())) {
        return res.status(403).json({
            success: false,
            message: 'Only admins can delete chats'
        });
    }
    await message_model_1.default.deleteMany({ chatId });
    await chat_model_1.default.findByIdAndDelete(chatId);
    return res.json({
        success: true,
        message: 'Chat deleted successfully'
    });
});
exports.addParticipant = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { chatId } = req.params;
    const { userId } = req.body;
    const currentUserId = req.user._id;
    const chat = await chat_model_1.default.findOne({
        _id: chatId,
        participants: currentUserId
    });
    if (!chat) {
        return res.status(404).json({
            success: false,
            message: 'Chat not found'
        });
    }
    if (!chat.canAddParticipants(currentUserId.toString())) {
        return res.status(403).json({
            success: false,
            message: 'You do not have permission to add participants'
        });
    }
    const user = await User_1.User.findById(userId);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }
    if (chat.isParticipant(userId)) {
        return res.status(400).json({
            success: false,
            message: 'User is already a participant'
        });
    }
    chat.participants.push(userId);
    await chat.save();
    const updatedChat = await chat_model_1.default.findById(chatId)
        .populate('participants', 'username firstName lastName avatar email status lastSeen')
        .populate('admins', 'username firstName lastName avatar');
    return res.json({
        success: true,
        message: 'Participant added successfully',
        data: updatedChat
    });
});
exports.removeParticipant = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { chatId, userId } = req.params;
    const currentUserId = req.user._id;
    const chat = await chat_model_1.default.findOne({
        _id: chatId,
        participants: currentUserId
    });
    if (!chat) {
        return res.status(404).json({
            success: false,
            message: 'Chat not found'
        });
    }
    if (!chat.canRemoveParticipants(currentUserId.toString())) {
        return res.status(403).json({
            success: false,
            message: 'You do not have permission to remove participants'
        });
    }
    if (chat.type === 'direct' && userId === currentUserId.toString()) {
        return res.status(400).json({
            success: false,
            message: 'Cannot remove yourself from direct chats'
        });
    }
    if (!chat.isParticipant(userId)) {
        return res.status(400).json({
            success: false,
            message: 'User is not a participant'
        });
    }
    chat.removeParticipant(userId);
    await chat.save();
    const updatedChat = await chat_model_1.default.findById(chatId)
        .populate('participants', 'username firstName lastName avatar email status lastSeen')
        .populate('admins', 'username firstName lastName avatar');
    return res.json({
        success: true,
        message: 'Participant removed successfully',
        data: updatedChat
    });
});
exports.addAdmin = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { chatId } = req.params;
    const { userId } = req.body;
    const currentUserId = req.user._id;
    const chat = await chat_model_1.default.findOne({
        _id: chatId,
        participants: currentUserId
    });
    if (!chat) {
        return res.status(404).json({
            success: false,
            message: 'Chat not found'
        });
    }
    if (!chat.isAdmin(currentUserId.toString())) {
        return res.status(403).json({
            success: false,
            message: 'Only admins can add other admins'
        });
    }
    if (!chat.isParticipant(userId)) {
        return res.status(400).json({
            success: false,
            message: 'User must be a participant to become admin'
        });
    }
    chat.addAdmin(userId);
    await chat.save();
    const updatedChat = await chat_model_1.default.findById(chatId)
        .populate('participants', 'username firstName lastName avatar email status lastSeen')
        .populate('admins', 'username firstName lastName avatar');
    return res.json({
        success: true,
        message: 'Admin added successfully',
        data: updatedChat
    });
});
exports.removeAdmin = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { chatId, userId } = req.params;
    const currentUserId = req.user._id;
    const chat = await chat_model_1.default.findOne({
        _id: chatId,
        participants: currentUserId
    });
    if (!chat) {
        return res.status(404).json({
            success: false,
            message: 'Chat not found'
        });
    }
    if (!chat.isAdmin(currentUserId.toString())) {
        return res.status(403).json({
            success: false,
            message: 'Only admins can remove other admins'
        });
    }
    if (userId === currentUserId.toString() && chat.admins.length === 1) {
        return res.status(400).json({
            success: false,
            message: 'Cannot remove the only admin'
        });
    }
    chat.removeAdmin(userId);
    await chat.save();
    const updatedChat = await chat_model_1.default.findById(chatId)
        .populate('participants', 'username firstName lastName avatar email status lastSeen')
        .populate('admins', 'username firstName lastName avatar');
    return res.json({
        success: true,
        message: 'Admin removed successfully',
        data: updatedChat
    });
});
exports.toggleMute = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { chatId } = req.params;
    const currentUserId = req.user._id;
    const chat = await chat_model_1.default.findOne({
        _id: chatId,
        participants: currentUserId
    });
    if (!chat) {
        return res.status(404).json({
            success: false,
            message: 'Chat not found'
        });
    }
    const isMuted = chat.toggleMute(currentUserId.toString());
    await chat.save();
    return res.json({
        success: true,
        message: `Chat ${isMuted ? 'muted' : 'unmuted'} successfully`,
        data: { isMuted }
    });
});
exports.togglePin = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { chatId } = req.params;
    const currentUserId = req.user._id;
    const chat = await chat_model_1.default.findOne({
        _id: chatId,
        participants: currentUserId
    });
    if (!chat) {
        return res.status(404).json({
            success: false,
            message: 'Chat not found'
        });
    }
    chat.isPinned = !chat.isPinned;
    await chat.save();
    return res.json({
        success: true,
        message: `Chat ${chat.isPinned ? 'pinned' : 'unpinned'} successfully`,
        data: { isPinned: chat.isPinned }
    });
});
exports.generateInviteLink = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { chatId } = req.params;
    const currentUserId = req.user._id;
    const chat = await chat_model_1.default.findOne({
        _id: chatId,
        participants: currentUserId
    });
    if (!chat) {
        return res.status(404).json({
            success: false,
            message: 'Chat not found'
        });
    }
    if (!chat.isAdmin(currentUserId.toString())) {
        return res.status(403).json({
            success: false,
            message: 'Only admins can generate invite links'
        });
    }
    const inviteToken = (0, uuid_1.v4)();
    chat.inviteLink = `${process.env.FRONTEND_URL}/join/${inviteToken}`;
    await chat.save();
    return res.json({
        success: true,
        message: 'Invite link generated successfully',
        data: { inviteLink: chat.inviteLink }
    });
});
exports.joinByInvite = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { inviteToken } = req.params;
    const currentUserId = req.user._id;
    const chat = await chat_model_1.default.findOne({
        inviteLink: { $regex: inviteToken }
    });
    if (!chat) {
        return res.status(404).json({
            success: false,
            message: 'Invalid invite link'
        });
    }
    if (chat.isParticipant(currentUserId.toString())) {
        return res.status(400).json({
            success: false,
            message: 'You are already a participant in this chat'
        });
    }
    chat.participants.push(new mongoose_1.default.Types.ObjectId(currentUserId));
    await chat.save();
    const updatedChat = await chat_model_1.default.findById(chat._id)
        .populate('participants', 'username firstName lastName avatar email status lastSeen')
        .populate('admins', 'username firstName lastName avatar');
    return res.json({
        success: true,
        message: 'Joined chat successfully',
        data: updatedChat
    });
});
//# sourceMappingURL=chat.controller.js.map