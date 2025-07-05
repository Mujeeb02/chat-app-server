import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
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

// Validation middleware
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  return next();
};

// Create chat
router.post('/', authenticateToken, [
  body('type')
    .isIn(['direct', 'group'])
    .withMessage('Type must be either direct or group'),
  body('participants')
    .isArray({ min: 1 })
    .withMessage('At least one participant is required'),
  body('participants.*')
    .isMongoId()
    .withMessage('Invalid participant ID'),
  body('name')
    .if(body('type').equals('group'))
    .notEmpty()
    .withMessage('Group name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Group name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  handleValidationErrors
], createChat);

// Get all chats for current user
router.get('/', authenticateToken, getChats);

// Get specific chat
router.get('/:chatId', authenticateToken, [
  body('chatId')
    .isMongoId()
    .withMessage('Invalid chat ID'),
  handleValidationErrors
], getChat);

// Update chat
router.put('/:chatId', authenticateToken, [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
  handleValidationErrors
], updateChat);

// Delete chat
router.delete('/:chatId', authenticateToken, deleteChat);

// Add participant
router.post('/:chatId/participants', authenticateToken, [
  body('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  handleValidationErrors
], addParticipant);

// Remove participant
router.delete('/:chatId/participants/:userId', authenticateToken, removeParticipant);

// Add admin
router.post('/:chatId/admins', authenticateToken, [
  body('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  handleValidationErrors
], addAdmin);

// Remove admin
router.delete('/:chatId/admins/:userId', authenticateToken, removeAdmin);

// Toggle mute
router.put('/:chatId/mute', authenticateToken, toggleMute);

// Toggle pin
router.put('/:chatId/pin', authenticateToken, togglePin);

// Generate invite link
router.post('/:chatId/invite', authenticateToken, generateInviteLink);

// Join by invite (public route)
router.post('/join/:inviteToken', authenticateToken, joinByInvite);

export default router; 