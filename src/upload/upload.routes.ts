import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  uploadImage,
  uploadVideo,
  uploadAudio,
  uploadFile,
  deleteFile,
  searchGifs,
  upload
} from './upload.controller';

const router = express.Router();

// Test endpoint to verify route is working (no auth required)
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Upload route is working', 
    timestamp: new Date().toISOString(),
    auth: 'This endpoint does not require authentication'
  });
});

// Test endpoint with auth to verify authentication is working
router.get('/test-auth', authenticateToken, (req, res) => {
  res.json({ 
    message: 'Upload route with auth is working', 
    timestamp: new Date().toISOString(),
    user: (req.user as any)._id,
    auth: 'This endpoint requires authentication'
  });
});

// All upload routes require authentication
router.use(authenticateToken);

// Upload image
router.post('/image', upload.single('image'), uploadImage);

// Upload video
router.post('/video', upload.single('video'), uploadVideo);

// Upload audio
router.post('/audio', upload.single('audio'), uploadAudio);

// Upload general file
router.post('/file', upload.single('file'), uploadFile);

// Delete file
router.delete('/:publicId', deleteFile);

// Search GIFs
router.get('/giphy', searchGifs);

export default router; 