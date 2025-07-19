import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { registerRules, loginRules } from '../middleware/validationRules';
import { 
  register, 
  login, 
  getProfile, 
  updateProfile 
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

router.post('/oauth', oauthLogin);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

export default router;
