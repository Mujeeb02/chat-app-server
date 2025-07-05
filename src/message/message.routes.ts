import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  reactToMessage,
  removeReaction,
  pinMessage,
  unpinMessage,
  forwardMessage,
  markAsSeen,
  searchMessages
} from './message.controller';

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log('Validation check for:', req.path, req.method);
  console.log('Request body:', req.body);
  console.log('Request params:', req.params);
  console.log('Request query:', req.query);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  console.log('Validation passed');
  return next();
};

// All message routes require authentication
router.use(authenticateToken);

// Send message
router.post('/', [
  body('chatId')
    .isMongoId()
    .withMessage('Invalid chat ID'),
  body('content')
    .custom((value, { req }) => {
      // Content is required for text messages, optional for media types
      const messageType = req.body.type || 'text';
      if (['text', 'gif', 'location'].includes(messageType) && !value) {
        throw new Error('Message content is required for text messages');
      }
      return true;
    })
    .isLength({ max: 5000 })
    .withMessage('Message content must be less than 5000 characters'),
  body('type')
    .optional()
    .isIn(['text', 'image', 'video', 'audio', 'file', 'gif', 'location'])
    .withMessage('Invalid message type'),
  body('replyTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid reply message ID'),
  body('mediaUrl')
    .custom((value, { req }) => {
      // Media URL is required for media types
      const messageType = req.body.type || 'text';
      if (['image', 'video', 'audio', 'file'].includes(messageType) && !value) {
        throw new Error('Media URL is required for media messages');
      }
      return true;
    })
    .optional()
    .isURL()
    .withMessage('Media URL must be a valid URL'),
  body('mediaSize')
    .optional()
    .isNumeric()
    .withMessage('Media size must be a number'),
  body('mediaDuration')
    .optional()
    .isNumeric()
    .withMessage('Media duration must be a number'),
  body('fileName')
    .optional()
    .isLength({ max: 255 })
    .withMessage('File name must be less than 255 characters'),
  body('location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('location.address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Address must be less than 500 characters'),
  handleValidationErrors
], sendMessage);

// Get messages for a chat
router.get('/:chatId', [
  param('chatId')
    .isMongoId()
    .withMessage('Invalid chat ID'),
  handleValidationErrors
], getMessages);

// Edit message
router.put('/:messageId', [
  body('content')
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ max: 5000 })
    .withMessage('Message content must be less than 5000 characters'),
  handleValidationErrors
], editMessage);

// Delete message
router.delete('/:messageId', deleteMessage);

// React to message
router.post('/:messageId/reactions', [
  body('emoji')
    .notEmpty()
    .withMessage('Emoji is required')
    .isLength({ max: 10 })
    .withMessage('Emoji must be less than 10 characters'),
  handleValidationErrors
], reactToMessage);

// Remove reaction
router.delete('/:messageId/reactions', [
  body('emoji')
    .notEmpty()
    .withMessage('Emoji is required'),
  handleValidationErrors
], removeReaction);

// Pin message
router.post('/:messageId/pin', pinMessage);

// Unpin message
router.delete('/:messageId/pin', unpinMessage);

// Forward message
router.post('/:messageId/forward', [
  body('chatIds')
    .isArray({ min: 1 })
    .withMessage('At least one target chat is required'),
  body('chatIds.*')
    .isMongoId()
    .withMessage('Invalid chat ID'),
  handleValidationErrors
], forwardMessage);

// Mark message as seen
router.post('/:messageId/seen', markAsSeen);

// Search messages
router.get('/search/:query', searchMessages);

export default router; 