import express from 'express';
import { body } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import {
  updateProfileRules,
  changePasswordRules,
  userParamRules
} from '../middleware/validationRules';
import {
  logout,
  getProfile,
  updateProfile,
  updatePreferences,
  changePassword,
  getAllUsers,
  getUserById,
  searchUsers,
  updateOnlineStatus,
  deleteAccount
} from './user.controller';

const router = express.Router();

// All user routes require authentication
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