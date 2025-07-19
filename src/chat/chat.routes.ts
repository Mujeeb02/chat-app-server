import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import {
  createChatRules,
  updateChatRules,
  chatParamRules,
  addParticipantRules,
  addAdminRules
} from '../middleware/validationRules';
import {
  createChat,
  getChats,
  getChat,
  updateChat,
  deleteChat,
  addParticipant,
  removeParticipant,
  addAdmin,
  removeAdmin,
  toggleMute,
  togglePin,
  generateInviteLink,
  joinByInvite
} from './chat.controller';

const router = express.Router();

// Create chat
router.post('/', 
  authenticateToken, 
  createChatRules, 
  handleValidationErrors, 
  createChat
);

// Get all chats for current user
router.get('/', authenticateToken, getChats);

// Get specific chat
router.get('/:chatId', 
  authenticateToken, 
  chatParamRules, 
  handleValidationErrors, 
  getChat
);

// Update chat
router.put('/:chatId', 
  authenticateToken, 
  updateChatRules, 
  handleValidationErrors, 
  updateChat
);

// Delete chat
router.delete('/:chatId', 
  authenticateToken, 
  chatParamRules, 
  handleValidationErrors, 
  deleteChat
);

// Add participant
router.post('/:chatId/participants', 
  authenticateToken, 
  addParticipantRules, 
  handleValidationErrors, 
  addParticipant
);

// Remove participant
router.delete('/:chatId/participants/:userId', 
  authenticateToken, 
  removeParticipant
);

// Add admin
router.post('/:chatId/admins', 
  authenticateToken, 
  addAdminRules, 
  handleValidationErrors, 
  addAdmin
);

// Remove admin
router.delete('/:chatId/admins/:userId', 
  authenticateToken, 
  removeAdmin
);

// Toggle mute
router.put('/:chatId/mute', 
  authenticateToken, 
  chatParamRules, 
  handleValidationErrors, 
  toggleMute
);

// Toggle pin
router.put('/:chatId/pin', 
  authenticateToken, 
  chatParamRules, 
  handleValidationErrors, 
  togglePin
);

// Generate invite link
router.post('/:chatId/invite', 
  authenticateToken, 
  chatParamRules, 
  handleValidationErrors, 
  generateInviteLink
);

// Join by invite
router.post('/join/:inviteToken', 
  authenticateToken, 
  joinByInvite
);

export default router; 