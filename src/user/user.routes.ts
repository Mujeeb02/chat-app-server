import express from 'express';
import { body, param } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import {
  registerRules,
  loginRules,
  refreshTokenRules,
  updateProfileRules,
  changePasswordRules,
  userParamRules
} from '../middleware/validationRules';
import {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  updatePreferences,
  changePassword,
  getAllUsers,
  getUserById,
  searchUsers,
  updateOnlineStatus,
  deleteAccount,
  forgotPassword,
  resetPassword
} from './user.controller';

const router = express.Router();

// Public routes
router.post('/register', 
  registerRules, 
  handleValidationErrors, 
  register
);

router.post('/login', 
  loginRules, 
  handleValidationErrors, 
  login
);

router.post('/refresh-token', 
  refreshTokenRules, 
  handleValidationErrors, 
  refreshToken
);

router.post('/forgot-password', 
  [body('email').isEmail().withMessage('Please provide a valid email')], 
  handleValidationErrors, 
  forgotPassword
);

router.post('/reset-password', 
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ], 
  handleValidationErrors, 
  resetPassword
);

// Protected routes
router.use(authenticateToken);

router.post('/logout', logout);

router.get('/profile', getProfile);

router.put('/profile', 
  updateProfileRules, 
  handleValidationErrors, 
  updateProfile
);

router.put('/preferences', 
  [
    body('preferences.theme')
      .optional()
      .isIn(['light', 'dark', 'auto'])
      .withMessage('Theme must be light, dark, or auto'),
    body('preferences.language')
      .optional()
      .isLength({ min: 2, max: 5 })
      .withMessage('Language code must be between 2 and 5 characters')
  ], 
  handleValidationErrors, 
  updatePreferences
);

router.put('/change-password', 
  changePasswordRules, 
  handleValidationErrors, 
  changePassword
);

router.put('/online-status', 
  [
    body('status')
      .optional()
      .isIn(['online', 'offline', 'away', 'busy'])
      .withMessage('Status must be online, offline, away, or busy'),
    body('isOnline')
      .optional()
      .isBoolean()
      .withMessage('isOnline must be a boolean')
  ], 
  handleValidationErrors, 
  updateOnlineStatus
);

router.delete('/account', 
  [body('password').notEmpty().withMessage('Password is required for account deletion')], 
  handleValidationErrors, 
  deleteAccount
);

// User listing and search (protected)
router.get('/', getAllUsers);

router.get('/search/:query', searchUsers);

router.get('/:userId', 
  userParamRules, 
  handleValidationErrors, 
  getUserById
);

export default router; 