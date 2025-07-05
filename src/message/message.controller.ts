import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { User } from '../user/User';
import Chat from '../chat/chat.model';
import Message, { IMessage } from './message.model';
import { IAuthRequest } from '../types';
import mongoose from 'mongoose';

export const sendMessage = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { chatId, content, type = 'text', replyTo, mediaUrl, mediaType, mediaSize, mediaDuration, fileName, location } = req.body;
  const currentUserId = req.user!._id;

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

  // Validate chat exists and user is participant
  const chat = await Chat.findOne({
    _id: chatId,
    participants: currentUserId
  });

  if (!chat) {
    return res.status(404).json({
      success: false,
      message: 'Chat not found'
    });
  }

  // Check if user can send messages
  if (!chat.canSendMessages(currentUserId.toString())) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to send messages in this chat'
    });
  }

  // Validate reply message if provided
  if (replyTo) {
    const replyMessage = await Message.findOne({
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

  // For media types, use mediaUrl as content if no content is provided
  let messageContent = content;
  if (['image', 'video', 'audio', 'file'].includes(type) && !content && mediaUrl) {
    messageContent = mediaUrl;
  }

  console.log('Message content after processing:', messageContent);

  // Create message
  const messageData: any = {
    content: messageContent,
    type,
    sender: currentUserId,
    chatId
  };

  if (replyTo) messageData.replyTo = replyTo;
  if (mediaUrl) messageData.mediaUrl = mediaUrl;
  if (mediaType) messageData.mediaType = mediaType;
  if (mediaSize) messageData.mediaSize = mediaSize;
  if (mediaDuration) messageData.mediaDuration = mediaDuration;
  if (fileName) messageData.fileName = fileName;
  if (location) messageData.location = location;

  console.log('Creating message with data:', messageData);

  const message = new Message(messageData);
  await message.save();

  console.log('Message saved successfully:', message._id);

  // Update chat's last message
  chat.lastMessage = message._id as mongoose.Types.ObjectId;
  await chat.save();

  // Mark message as delivered to sender
  (message as IMessage).markAsDelivered(currentUserId.toString());
  await message.save();

  // Populate sender and return
  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'username firstName lastName avatar')
    .populate('replyTo', 'content sender')
    .populate('reactions.user', 'username firstName lastName avatar');

  return res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: populatedMessage
  });
});

export const getMessages = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { chatId } = req.params;
  const { page = 1, limit = 50, before, after } = req.query;
  const currentUserId = req.user!._id;

  console.log('getMessages called with:', { chatId, page, limit, currentUserId });

  // Validate chat exists and user is participant
  const chat = await Chat.findOne({
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
  
  let query: any = { chatId };
  
  // Add date filters if provided
  if (before) {
    query.createdAt = { ...query.createdAt, $lt: new Date(before as string) };
  }
  
  if (after) {
    query.createdAt = { ...query.createdAt, $gt: new Date(after as string) };
  }

  console.log('Query:', query);

  const messages = await Message.find(query)
    .populate('sender', 'username firstName lastName avatar')
    .populate('replyTo', 'content sender')
    .populate('reactions.user', 'username firstName lastName avatar')
    .populate('seenBy', 'username firstName lastName avatar')
    .populate('deliveredTo', 'username firstName lastName avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  console.log('Messages found:', messages.length);

  const total = await Message.countDocuments({ chatId });

  // Mark messages as seen
  const messageIds = messages.map((msg: any) => msg._id);
  await Message.updateMany(
    { _id: { $in: messageIds }, seenBy: { $ne: currentUserId } },
    { $push: { seenBy: currentUserId } }
  );

  return res.json({
    success: true,
    data: messages.reverse(), // Return in chronological order
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  });
});

export const editMessage = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { messageId } = req.params;
  const { content } = req.body;
  const currentUserId = req.user!._id;

  const message = await Message.findById(messageId)
    .populate('sender', 'username firstName lastName avatar');

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }

  // Check if user is the sender
  if (message.sender._id.toString() !== currentUserId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only edit your own messages'
    });
  }

  // Check if message is too old (e.g., 15 minutes)
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  if (message.createdAt < fifteenMinutesAgo) {
    return res.status(400).json({
      success: false,
      message: 'Messages can only be edited within 15 minutes'
    });
  }

  // Edit message
  (message as IMessage).edit(content);
  await message.save();

  return res.json({
    success: true,
    message: 'Message edited successfully',
    data: message
  });
});

export const deleteMessage = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { messageId } = req.params;
  const currentUserId = req.user!._id;

  const message = await Message.findById(messageId);

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }

  // Check if user is the sender or admin
  const chat = await Chat.findById(message.chatId);
  const isSender = message.sender.toString() === currentUserId.toString();
  const isAdmin = chat?.isAdmin(currentUserId.toString()) || false;

  if (!isSender && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete your own messages or be an admin'
    });
  }

  // Delete message
  (message as IMessage).delete();
  await message.save();

  return res.json({
    success: true,
    message: 'Message deleted successfully'
  });
});

export const reactToMessage = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const currentUserId = req.user!._id;

  const message = await Message.findById(messageId);

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }

  // Check if user is participant in the chat
  const chat = await Chat.findOne({
    _id: message.chatId,
    participants: currentUserId
  });

  if (!chat) {
    return res.status(403).json({
      success: false,
      message: 'You are not a participant in this chat'
    });
  }

  // Add reaction
  const reactionAdded = (message as IMessage).addReaction(currentUserId.toString(), emoji);
  await message.save();

  if (!reactionAdded) {
    return res.status(400).json({
      success: false,
      message: 'You have already reacted with this emoji'
    });
  }

  const updatedMessage = await Message.findById(messageId)
    .populate('sender', 'username firstName lastName avatar')
    .populate('reactions.user', 'username firstName lastName avatar');

  return res.json({
    success: true,
    message: 'Reaction added successfully',
    data: updatedMessage
  });
});

export const removeReaction = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const currentUserId = req.user!._id;

  const message = await Message.findById(messageId);

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }

  // Remove reaction
  const reactionRemoved = (message as IMessage).removeReaction(currentUserId.toString(), emoji);
  await message.save();

  if (!reactionRemoved) {
    return res.status(400).json({
      success: false,
      message: 'Reaction not found'
    });
  }

  const updatedMessage = await Message.findById(messageId)
    .populate('sender', 'username firstName lastName avatar')
    .populate('reactions.user', 'username firstName lastName avatar');

  return res.json({
    success: true,
    message: 'Reaction removed successfully',
    data: updatedMessage
  });
});

export const pinMessage = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { messageId } = req.params;
  const currentUserId = req.user!._id;

  const message = await Message.findById(messageId);

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }

  // Check if user can pin messages
  const chat = await Chat.findOne({
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

  // Pin message
  (message as IMessage).pin();
  await message.save();

  // Add to chat's pinned messages
  chat.pinnedMessages.push(message._id as mongoose.Types.ObjectId);
  await chat.save();

  return res.json({
    success: true,
    message: 'Message pinned successfully'
  });
});

export const unpinMessage = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { messageId } = req.params;
  const currentUserId = req.user!._id;

  const message = await Message.findById(messageId);

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }

  // Check if user can unpin messages
  const chat = await Chat.findOne({
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

  // Unpin message
  (message as IMessage).unpin();
  await message.save();

  // Remove from chat's pinned messages
  chat.pinnedMessages = chat.pinnedMessages.filter(
    msgId => msgId.toString() !== messageId
  );
  await chat.save();

  return res.json({
    success: true,
    message: 'Message unpinned successfully'
  });
});

export const forwardMessage = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { messageId } = req.params;
  const { chatIds } = req.body;
  const currentUserId = req.user!._id;

  const message = await Message.findById(messageId);

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }

  // Validate target chats
  const chats = await Chat.find({
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

  // Forward message to each chat
  for (const chat of chats) {
    // Check if user can send messages in this chat
    if (!chat.canSendMessages(currentUserId.toString())) {
      continue; // Skip this chat
    }

    const forwardedMessage = new Message({
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

    // Update chat's last message
    chat.lastMessage = forwardedMessage._id as mongoose.Types.ObjectId;
    await chat.save();

    // Mark as delivered to sender
    (forwardedMessage as IMessage).markAsDelivered(currentUserId.toString());
    await forwardedMessage.save();

    const populatedMessage = await Message.findById(forwardedMessage._id)
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

export const markAsSeen = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { messageId } = req.params;
  const currentUserId = req.user!._id;

  const message = await Message.findById(messageId);

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }

  // Check if user is participant in the chat
  const chat = await Chat.findOne({
    _id: message.chatId,
    participants: currentUserId
  });

  if (!chat) {
    return res.status(403).json({
      success: false,
      message: 'You are not a participant in this chat'
    });
  }

  // Mark as seen
  const markedAsSeen = (message as IMessage).markAsSeen(currentUserId.toString());
  await message.save();

  return res.json({
    success: true,
    message: markedAsSeen ? 'Message marked as seen' : 'Message already seen'
  });
});

export const searchMessages = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { query } = req.params;
  const { chatId, page = 1, limit = 20 } = req.query;
  const currentUserId = req.user!._id;

  let searchQuery: any = {
    content: { $regex: query, $options: 'i' }
  };

  if (chatId) {
    // Check if user is participant in the chat
    const chat = await Chat.findOne({
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
  } else {
    // Search in all chats where user is participant
    const userChats = await Chat.find({ participants: currentUserId });
    searchQuery.chatId = { $in: userChats.map(chat => chat._id) };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const messages = await Message.find(searchQuery)
    .populate('sender', 'username firstName lastName avatar')
    .populate('chatId', 'name type')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Message.countDocuments(searchQuery);

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