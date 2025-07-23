import { Router } from 'express';
import { body } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { registerRules, loginRules, refreshTokenRules } from '../middleware/validationRules';
import { 
  register, 
  login, 
  refreshToken,
  logout,
  getProfile, 
  updateProfile,
  forgotPassword,
  resetPassword
} from '../user/user.controller';
import { oauthLogin } from './auth.controller';

const router = Router();

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

router.post('/oauth', oauthLogin);

// Protected routes
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

export default router;
