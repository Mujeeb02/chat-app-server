import { Request, Response } from 'express';
import Chat, { IChat } from './chat.model';
import { User } from '../user/User';
import Message from '../message/message.model';
import { asyncHandler } from '../middleware/errorHandler';
import { IAuthRequest } from '../types';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

export const createChat = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { name, type, participants, description } = req.body;
  const currentUserId = req.user!._id;

  console.log(req.body);
  
  // Validate participants
  if (!participants || participants.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one participant is required'
    });
  }

  // Add current user to participants if not already included
  const allParticipants = participants.includes(currentUserId.toString()) 
    ? participants 
    : [...participants, currentUserId.toString()];

  // For direct chats, ensure exactly 2 participants
  if (type === 'direct' && allParticipants.length !== 2) {
    return res.status(400).json({
      success: false,
      message: 'Direct chats must have exactly 2 participants'
    });
  }

  // For group chats, ensure at least 2 participants
  if (type === 'group' && allParticipants.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Group chats must have at least 2 participants'
    });
  }

  // Check if direct chat already exists between these users
  if (type === 'direct') {
    const existingChat = await Chat.findOne({
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

  // Verify all participants exist
  const participantUsers = await User.find({
    _id: { $in: allParticipants }
  });

  if (participantUsers.length !== allParticipants.length) {
    return res.status(400).json({
      success: false,
      message: 'One or more participants not found'
    });
  }

  // Create chat
  const chatData: any = {
    type,
    participants: allParticipants,
    admins: [currentUserId] // Creator is admin
  };

  if (type === 'group') {
    chatData.name = name;
    chatData.description = description || '';
  } else {
    // For direct chats, generate name from other participant
    const otherParticipantId = allParticipants.find((id: string) => id !== currentUserId.toString());
    const otherParticipant = participantUsers.find((user: any) => user._id.toString() === otherParticipantId);
    if (otherParticipant) {
      chatData.name = `${otherParticipant.firstName} ${otherParticipant.lastName}`;
    }
  }

  const chat = new Chat(chatData);
  await chat.save();

  // Populate participants and return
  const populatedChat = await Chat.findById(chat._id)
    .populate('participants', 'username firstName lastName avatar email status lastSeen')
    .populate('admins', 'username firstName lastName avatar');

  return res.status(201).json({
    success: true,
    message: 'Chat created successfully',
    data: populatedChat
  });
});

export const getChats = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const currentUserId = req.user!._id;
  const { page = 1, limit = 20, type, search } = req.query;

  const query: any = {
    participants: currentUserId
  };

  if (type) {
    query.type = type;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search as string, $options: 'i' } },
      { description: { $regex: search as string, $options: 'i' } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const chats = await Chat.find(query)
    .populate('participants', 'username firstName lastName avatar email status lastSeen')
    .populate('admins', 'username firstName lastName avatar')
    .populate('lastMessage')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Chat.countDocuments(query);

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

export const getChat = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { chatId } = req.params;
  const currentUserId = req.user!._id;

  const chat = await Chat.findOne({
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

export const updateChat = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { chatId } = req.params;
  const { name, description, avatar, settings } = req.body;
  const currentUserId = req.user!._id;

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

  // Check permissions
  if (!chat.canEditInfo(currentUserId.toString())) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to edit this chat'
    });
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (avatar !== undefined) updateData.avatar = avatar;
  if (settings !== undefined) updateData.settings = { ...chat.settings, ...settings };

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    updateData,
    { new: true, runValidators: true }
  )
  .populate('participants', 'username firstName lastName avatar email status lastSeen')
  .populate('admins', 'username firstName lastName avatar');

  return res.json({
    success: true,
    message: 'Chat updated successfully',
    data: updatedChat
  });
});

export const deleteChat = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { chatId } = req.params;
  const currentUserId = req.user!._id;

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

  // Check if user is admin
  if (!chat.isAdmin(currentUserId.toString())) {
    return res.status(403).json({
      success: false,
      message: 'Only admins can delete chats'
    });
  }

  // Delete all messages in the chat
  await Message.deleteMany({ chatId });

  // Delete the chat
  await Chat.findByIdAndDelete(chatId);

  return res.json({
    success: true,
    message: 'Chat deleted successfully'
  });
});

export const addParticipant = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { chatId } = req.params;
  const { userId } = req.body;
  const currentUserId = req.user!._id;

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

  // Check permissions
  if (!chat.canAddParticipants(currentUserId.toString())) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to add participants'
    });
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if user is already a participant
  if (chat.isParticipant(userId)) {
    return res.status(400).json({
      success: false,
      message: 'User is already a participant'
    });
  }

  // Add participant
  chat.participants.push(userId);
  await chat.save();

  const updatedChat = await Chat.findById(chatId)
    .populate('participants', 'username firstName lastName avatar email status lastSeen')
    .populate('admins', 'username firstName lastName avatar');

  return res.json({
    success: true,
    message: 'Participant added successfully',
    data: updatedChat
  });
});

export const removeParticipant = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { chatId, userId } = req.params;
  const currentUserId = req.user!._id;

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

  // Check permissions
  if (!chat.canRemoveParticipants(currentUserId.toString())) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to remove participants'
    });
  }

  // Cannot remove yourself from direct chats
  if (chat.type === 'direct' && userId === currentUserId.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Cannot remove yourself from direct chats'
    });
  }

  // Check if user is a participant
  if (!chat.isParticipant(userId)) {
    return res.status(400).json({
      success: false,
      message: 'User is not a participant'
    });
  }

  // Remove participant
  chat.removeParticipant(userId);
  await chat.save();

  const updatedChat = await Chat.findById(chatId)
    .populate('participants', 'username firstName lastName avatar email status lastSeen')
    .populate('admins', 'username firstName lastName avatar');

  return res.json({
    success: true,
    message: 'Participant removed successfully',
    data: updatedChat
  });
});

export const addAdmin = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { chatId } = req.params;
  const { userId } = req.body;
  const currentUserId = req.user!._id;

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

  // Check if current user is admin
  if (!chat.isAdmin(currentUserId.toString())) {
    return res.status(403).json({
      success: false,
      message: 'Only admins can add other admins'
    });
  }

  // Check if user is a participant
  if (!chat.isParticipant(userId)) {
    return res.status(400).json({
      success: false,
      message: 'User must be a participant to become admin'
    });
  }

  // Add admin
  chat.addAdmin(userId);
  await chat.save();

  const updatedChat = await Chat.findById(chatId)
    .populate('participants', 'username firstName lastName avatar email status lastSeen')
    .populate('admins', 'username firstName lastName avatar');

  return res.json({
    success: true,
    message: 'Admin added successfully',
    data: updatedChat
  });
});

export const removeAdmin = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { chatId, userId } = req.params;
  const currentUserId = req.user!._id;

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

  // Check if current user is admin
  if (!chat.isAdmin(currentUserId.toString())) {
    return res.status(403).json({
      success: false,
      message: 'Only admins can remove other admins'
    });
  }

  // Cannot remove yourself as admin if you're the only admin
  if (userId === currentUserId.toString() && chat.admins.length === 1) {
    return res.status(400).json({
      success: false,
      message: 'Cannot remove the only admin'
    });
  }

  // Remove admin
  chat.removeAdmin(userId);
  await chat.save();

  const updatedChat = await Chat.findById(chatId)
    .populate('participants', 'username firstName lastName avatar email status lastSeen')
    .populate('admins', 'username firstName lastName avatar');

  return res.json({
    success: true,
    message: 'Admin removed successfully',
    data: updatedChat
  });
});

export const toggleMute = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { chatId } = req.params;
  const currentUserId = req.user!._id;

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

  const isMuted = chat.toggleMute(currentUserId.toString());
  await chat.save();

  return res.json({
    success: true,
    message: `Chat ${isMuted ? 'muted' : 'unmuted'} successfully`,
    data: { isMuted }
  });
});

export const togglePin = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { chatId } = req.params;
  const currentUserId = req.user!._id;

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

  chat.isPinned = !chat.isPinned;
  await chat.save();

  return res.json({
    success: true,
    message: `Chat ${chat.isPinned ? 'pinned' : 'unpinned'} successfully`,
    data: { isPinned: chat.isPinned }
  });
});

export const generateInviteLink = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { chatId } = req.params;
  const currentUserId = req.user!._id;

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

  // Check if user is admin
  if (!chat.isAdmin(currentUserId.toString())) {
    return res.status(403).json({
      success: false,
      message: 'Only admins can generate invite links'
    });
  }

  // Generate invite link
  const inviteToken = uuidv4();
  chat.inviteLink = `${process.env.FRONTEND_URL}/join/${inviteToken}`;
  await chat.save();

  return res.json({
    success: true,
    message: 'Invite link generated successfully',
    data: { inviteLink: chat.inviteLink }
  });
});

export const joinByInvite = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { inviteToken } = req.params;
  const currentUserId = req.user!._id;

  const chat = await Chat.findOne({
    inviteLink: { $regex: inviteToken }
  });

  if (!chat) {
    return res.status(404).json({
      success: false,
      message: 'Invalid invite link'
    });
  }

  // Check if user is already a participant
  if (chat.isParticipant(currentUserId.toString())) {
    return res.status(400).json({
      success: false,
      message: 'You are already a participant in this chat'
    });
  }

  // Add user to participants
  chat.participants.push(new mongoose.Types.ObjectId(currentUserId));
  await chat.save();

  const updatedChat = await Chat.findById(chat._id)
    .populate('participants', 'username firstName lastName avatar email status lastSeen')
    .populate('admins', 'username firstName lastName avatar');

  return res.json({
    success: true,
    message: 'Joined chat successfully',
    data: updatedChat
  });
}); 