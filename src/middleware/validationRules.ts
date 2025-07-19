import { body, param, query } from 'express-validator';

// Chat validation rules
export const createChatRules = [
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
    .withMessage('Description must be less than 500 characters')
];

export const updateChatRules = [
  param('chatId')
    .isMongoId()
    .withMessage('Invalid chat ID'),
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
    .withMessage('Avatar must be a valid URL')
];

export const chatParamRules = [
  param('chatId')
    .isMongoId()
    .withMessage('Invalid chat ID')
];

export const addParticipantRules = [
  param('chatId')
    .isMongoId()
    .withMessage('Invalid chat ID'),
  body('userId')
    .isMongoId()
    .withMessage('Invalid user ID')
];

export const addAdminRules = [
  param('chatId')
    .isMongoId()
    .withMessage('Invalid chat ID'),
  body('userId')
    .isMongoId()
    .withMessage('Invalid user ID')
];

// Message validation rules
export const sendMessageRules = [
  body('chatId')
    .isMongoId()
    .withMessage('Invalid chat ID'),
  body('content')
    .custom((value, { req }) => {
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
    .withMessage('Address must be less than 500 characters')
];

export const messageParamRules = [
  param('messageId')
    .isMongoId()
    .withMessage('Invalid message ID')
];

export const editMessageRules = [
  param('messageId')
    .isMongoId()
    .withMessage('Invalid message ID'),
  body('content')
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ max: 5000 })
    .withMessage('Message content must be less than 5000 characters')
];

export const reactionRules = [
  param('messageId')
    .isMongoId()
    .withMessage('Invalid message ID'),
  body('emoji')
    .notEmpty()
    .withMessage('Emoji is required')
    .isLength({ max: 10 })
    .withMessage('Emoji must be less than 10 characters')
];

export const forwardMessageRules = [
  param('messageId')
    .isMongoId()
    .withMessage('Invalid message ID'),
  body('chatIds')
    .isArray({ min: 1 })
    .withMessage('At least one target chat is required'),
  body('chatIds.*')
    .isMongoId()
    .withMessage('Invalid chat ID')
];

// User validation rules
export const registerRules = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
];

export const loginRules = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const refreshTokenRules = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
];

export const updateProfileRules = [
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  body('avatar')
    .optional()
    .custom((value) => {
      if (!value) return true;
      if (value.startsWith('data:')) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    })
    .withMessage('Avatar must be a valid URL or data URL')
];

export const changePasswordRules = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

export const userParamRules = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID')
];