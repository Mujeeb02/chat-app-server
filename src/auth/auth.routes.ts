import { Router } from 'express';
import { 
  register, 
  login, 
  oauthLogin, 
  getProfile, 
  updateProfile 
} from './auth.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/oauth', oauthLogin);

// Protected routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;
