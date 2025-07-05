"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchMessages = exports.markAsSeen = exports.forwardMessage = exports.unpinMessage = exports.pinMessage = exports.removeReaction = exports.reactToMessage = exports.deleteMessage = exports.editMessage = exports.getMessages = exports.sendMessage = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const chat_model_1 = __importDefault(require("../chat/chat.model"));
const message_model_1 = __importDefault(require("./message.model"));
exports.sendMessage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { chatId, content, type = 'text', replyTo, mediaUrl, mediaType, mediaSize, mediaDuration, fileName, location } = req.body;
    const currentUserId = req.user._id;
    console.log('sendMessage called with:', {
        chatId,
        content,
        type,
        mediaUrl,
        mediaType,
        mediaSize,
        fileName,
        currentUserId
    });
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
    if (!chat.canSendMessages(currentUserId.toString())) {
        return res.status(403).json({
            success: false,
            message: 'You do not have permission to send messages in this chat'
        });
    }
    if (replyTo) {
        const replyMessage = await message_model_1.default.findOne({
            _id: replyTo,
            chatId
        });
        if (!replyMessage) {
            return res.status(400).json({
                success: false,
                message: 'Reply message not found'
            });
        }
    }
    let messageContent = content;
    if (['image', 'video', 'audio', 'file'].includes(type) && !content && mediaUrl) {
        messageContent = mediaUrl;
    }
    console.log('Message content after processing:', messageContent);
    const messageData = {
        content: messageContent,
        type,
        sender: currentUserId,
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
    if (mediaDuration)
        messageData.mediaDuration = mediaDuration;
    if (fileName)
        messageData.fileName = fileName;
    if (location)
        messageData.location = location;
    console.log('Creating message with data:', messageData);
    const message = new message_model_1.default(messageData);
    await message.save();
    console.log('Message saved successfully:', message._id);
    chat.lastMessage = message._id;
    await chat.save();
    message.markAsDelivered(currentUserId.toString());
    await message.save();
    const populatedMessage = await message_model_1.default.findById(message._id)
        .populate('sender', 'username firstName lastName avatar')
        .populate('replyTo', 'content sender')
        .populate('reactions.user', 'username firstName lastName avatar');
    return res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: populatedMessage
    });
});
exports.getMessages = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { chatId } = req.params;
    const { page = 1, limit = 50, before, after } = req.query;
    const currentUserId = req.user._id;
    console.log('getMessages called with:', { chatId, page, limit, currentUserId });
    const chat = await chat_model_1.default.findOne({
        _id: chatId,
        participants: currentUserId
    });
    console.log('Chat found:', chat ? 'yes' : 'no');
    if (!chat) {
        return res.status(404).json({
            success: false,
            message: 'Chat not found'
        });
    }
    const skip = (Number(page) - 1) * Number(limit);
    let query = { chatId };
    if (before) {
        query.createdAt = { ...query.createdAt, $lt: new Date(before) };
    }
    if (after) {
        query.createdAt = { ...query.createdAt, $gt: new Date(after) };
    }
    console.log('Query:', query);
    const messages = await message_model_1.default.find(query)
        .populate('sender', 'username firstName lastName avatar')
        .populate('replyTo', 'content sender')
        .populate('reactions.user', 'username firstName lastName avatar')
        .populate('seenBy', 'username firstName lastName avatar')
        .populate('deliveredTo', 'username firstName lastName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));
    console.log('Messages found:', messages.length);
    const total = await message_model_1.default.countDocuments({ chatId });
    const messageIds = messages.map((msg) => msg._id);
    await message_model_1.default.updateMany({ _id: { $in: messageIds }, seenBy: { $ne: currentUserId } }, { $push: { seenBy: currentUserId } });
    return res.json({
        success: true,
        data: messages.reverse(),
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
        }
    });
});
exports.editMessage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { messageId } = req.params;
    const { content } = req.body;
    const currentUserId = req.user._id;
    const message = await message_model_1.default.findById(messageId)
        .populate('sender', 'username firstName lastName avatar');
    if (!message) {
        return res.status(404).json({
            success: false,
            message: 'Message not found'
        });
    }
    if (message.sender._id.toString() !== currentUserId.toString()) {
        return res.status(403).json({
            success: false,
            message: 'You can only edit your own messages'
        });
    }
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.createdAt < fifteenMinutesAgo) {
        return res.status(400).json({
            success: false,
            message: 'Messages can only be edited within 15 minutes'
        });
    }
    message.edit(content);
    await message.save();
    return res.json({
        success: true,
        message: 'Message edited successfully',
        data: message
    });
});
exports.deleteMessage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { messageId } = req.params;
    const currentUserId = req.user._id;
    const message = await message_model_1.default.findById(messageId);
    if (!message) {
        return res.status(404).json({
            success: false,
            message: 'Message not found'
        });
    }
    const chat = await chat_model_1.default.findById(message.chatId);
    const isSender = message.sender.toString() === currentUserId.toString();
    const isAdmin = chat?.isAdmin(currentUserId.toString()) || false;
    if (!isSender && !isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'You can only delete your own messages or be an admin'
        });
    }
    message.delete();
    await message.save();
    return res.json({
        success: true,
        message: 'Message deleted successfully'
    });
});
exports.reactToMessage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const currentUserId = req.user._id;
    const message = await message_model_1.default.findById(messageId);
    if (!message) {
        return res.status(404).json({
            success: false,
            message: 'Message not found'
        });
    }
    const chat = await chat_model_1.default.findOne({
        _id: message.chatId,
        participants: currentUserId
    });
    if (!chat) {
        return res.status(403).json({
            success: false,
            message: 'You are not a participant in this chat'
        });
    }
    const reactionAdded = message.addReaction(currentUserId.toString(), emoji);
    await message.save();
    if (!reactionAdded) {
        return res.status(400).json({
            success: false,
            message: 'You have already reacted with this emoji'
        });
    }
    const updatedMessage = await message_model_1.default.findById(messageId)
        .populate('sender', 'username firstName lastName avatar')
        .populate('reactions.user', 'username firstName lastName avatar');
    return res.json({
        success: true,
        message: 'Reaction added successfully',
        data: updatedMessage
    });
});
exports.removeReaction = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const currentUserId = req.user._id;
    const message = await message_model_1.default.findById(messageId);
    if (!message) {
        return res.status(404).json({
            success: false,
            message: 'Message not found'
        });
    }
    const reactionRemoved = message.removeReaction(currentUserId.toString(), emoji);
    await message.save();
    if (!reactionRemoved) {
        return res.status(400).json({
            success: false,
            message: 'Reaction not found'
        });
    }
    const updatedMessage = await message_model_1.default.findById(messageId)
        .populate('sender', 'username firstName lastName avatar')
        .populate('reactions.user', 'username firstName lastName avatar');
    return res.json({
        success: true,
        message: 'Reaction removed successfully',
        data: updatedMessage
    });
});
exports.pinMessage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { messageId } = req.params;
    const currentUserId = req.user._id;
    const message = await message_model_1.default.findById(messageId);
    if (!message) {
        return res.status(404).json({
            success: false,
            message: 'Message not found'
        });
    }
    const chat = await chat_model_1.default.findOne({
        _id: message.chatId,
        participants: currentUserId
    });
    if (!chat) {
        return res.status(403).json({
            success: false,
            message: 'You are not a participant in this chat'
        });
    }
    if (!chat.canPinMessages(currentUserId.toString())) {
        return res.status(403).json({
            success: false,
            message: 'You do not have permission to pin messages'
        });
    }
    message.pin();
    await message.save();
    chat.pinnedMessages.push(message._id);
    await chat.save();
    return res.json({
        success: true,
        message: 'Message pinned successfully'
    });
});
exports.unpinMessage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { messageId } = req.params;
    const currentUserId = req.user._id;
    const message = await message_model_1.default.findById(messageId);
    if (!message) {
        return res.status(404).json({
            success: false,
            message: 'Message not found'
        });
    }
    const chat = await chat_model_1.default.findOne({
        _id: message.chatId,
        participants: currentUserId
    });
    if (!chat) {
        return res.status(403).json({
            success: false,
            message: 'You are not a participant in this chat'
        });
    }
    if (!chat.canPinMessages(currentUserId.toString())) {
        return res.status(403).json({
            success: false,
            message: 'You do not have permission to unpin messages'
        });
    }
    message.unpin();
    await message.save();
    chat.pinnedMessages = chat.pinnedMessages.filter(msgId => msgId.toString() !== messageId);
    await chat.save();
    return res.json({
        success: true,
        message: 'Message unpinned successfully'
    });
});
exports.forwardMessage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { messageId } = req.params;
    const { chatIds } = req.body;
    const currentUserId = req.user._id;
    const message = await message_model_1.default.findById(messageId);
    if (!message) {
        return res.status(404).json({
            success: false,
            message: 'Message not found'
        });
    }
    const chats = await chat_model_1.default.find({
        _id: { $in: chatIds },
        participants: currentUserId
    });
    if (chats.length !== chatIds.length) {
        return res.status(400).json({
            success: false,
            message: 'One or more target chats not found or you are not a participant'
        });
    }
    const forwardedMessages = [];
    for (const chat of chats) {
        if (!chat.canSendMessages(currentUserId.toString())) {
            continue;
        }
        const forwardedMessage = new message_model_1.default({
            content: message.content,
            type: message.type,
            sender: currentUserId,
            chatId: chat._id,
            isForwarded: true,
            forwardedFrom: message._id,
            mediaUrl: message.mediaUrl,
            mediaType: message.mediaType,
            mediaSize: message.mediaSize,
            mediaDuration: message.mediaDuration,
            fileName: message.fileName,
            location: message.location
        });
        await forwardedMessage.save();
        chat.lastMessage = forwardedMessage._id;
        await chat.save();
        forwardedMessage.markAsDelivered(currentUserId.toString());
        await forwardedMessage.save();
        const populatedMessage = await message_model_1.default.findById(forwardedMessage._id)
            .populate('sender', 'username firstName lastName avatar')
            .populate('forwardedFrom', 'content sender');
        forwardedMessages.push(populatedMessage);
    }
    return res.json({
        success: true,
        message: `Message forwarded to ${forwardedMessages.length} chats`,
        data: forwardedMessages
    });
});
exports.markAsSeen = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { messageId } = req.params;
    const currentUserId = req.user._id;
    const message = await message_model_1.default.findById(messageId);
    if (!message) {
        return res.status(404).json({
            success: false,
            message: 'Message not found'
        });
    }
    const chat = await chat_model_1.default.findOne({
        _id: message.chatId,
        participants: currentUserId
    });
    if (!chat) {
        return res.status(403).json({
            success: false,
            message: 'You are not a participant in this chat'
        });
    }
    const markedAsSeen = message.markAsSeen(currentUserId.toString());
    await message.save();
    return res.json({
        success: true,
        message: markedAsSeen ? 'Message marked as seen' : 'Message already seen'
    });
});
exports.searchMessages = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { query } = req.params;
    const { chatId, page = 1, limit = 20 } = req.query;
    const currentUserId = req.user._id;
    let searchQuery = {
        content: { $regex: query, $options: 'i' }
    };
    if (chatId) {
        const chat = await chat_model_1.default.findOne({
            _id: chatId,
            participants: currentUserId
        });
        if (!chat) {
            return res.status(403).json({
                success: false,
                message: 'You are not a participant in this chat'
            });
        }
        searchQuery.chatId = chatId;
    }
    else {
        const userChats = await chat_model_1.default.find({ participants: currentUserId });
        searchQuery.chatId = { $in: userChats.map(chat => chat._id) };
    }
    const skip = (Number(page) - 1) * Number(limit);
    const messages = await message_model_1.default.find(searchQuery)
        .populate('sender', 'username firstName lastName avatar')
        .populate('chatId', 'name type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));
    const total = await message_model_1.default.countDocuments(searchQuery);
    return res.json({
        success: true,
        data: messages,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
        }
    });
});
//# sourceMappingURL=message.controller.js.map