import { Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { asyncHandler } from '../middleware/errorHandler';
import { IAuthRequest } from '../types';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Validate Cloudinary configuration
const validateCloudinaryConfig = () => {
  const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing Cloudinary configuration: ${missing.join(', ')}`);
  }
};

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav', 'application/pdf', 'text/plain'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

export const uploadImage = asyncHandler(async (req: IAuthRequest, res: Response) => {
  try {
    // Validate Cloudinary configuration
    validateCloudinaryConfig();
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    console.log('Uploading image:', req.file.originalname, 'Size:', req.file.size);
    console.log('User ID:', req.user?._id);
    
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'chat-app/images',
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Image uploaded successfully:', result?.public_id);
            resolve(result);
          }
        }
      );

      stream.end(req.file!.buffer);
    });

    return res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: (result as any).secure_url,
        publicId: (result as any).public_id,
        width: (result as any).width,
        height: (result as any).height,
        format: (result as any).format,
        size: (result as any).bytes
      }
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to upload image'
    });
  }
});

export const uploadVideo = asyncHandler(async (req: IAuthRequest, res: Response) => {
  try {
    // Validate Cloudinary configuration
    validateCloudinaryConfig();
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file provided'
      });
    }

    console.log('Uploading video:', req.file.originalname, 'Size:', req.file.size);
    
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'chat-app/videos',
          resource_type: 'video',
          transformation: [
            { width: 640, height: 480, crop: 'limit' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Video uploaded successfully:', result?.public_id);
            resolve(result);
          }
        }
      );

      stream.end(req.file!.buffer);
    });

    return res.json({
      success: true,
      message: 'Video uploaded successfully',
      data: {
        url: (result as any).secure_url,
        publicId: (result as any).public_id,
        width: (result as any).width,
        height: (result as any).height,
        format: (result as any).format,
        size: (result as any).bytes,
        duration: (result as any).duration
      }
    });
  } catch (error) {
    console.error('Video upload error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to upload video'
    });
  }
});

export const uploadAudio = asyncHandler(async (req: IAuthRequest, res: Response) => {
  try {
    // Validate Cloudinary configuration
    validateCloudinaryConfig();
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file provided'
      });
    }

    console.log('Uploading audio:', req.file.originalname, 'Size:', req.file.size);
    
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'chat-app/audio',
          resource_type: 'video', // Cloudinary treats audio as video
          transformation: [
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Audio uploaded successfully:', result?.public_id);
            resolve(result);
          }
        }
      );

      stream.end(req.file!.buffer);
    });

    return res.json({
      success: true,
      message: 'Audio uploaded successfully',
      data: {
        url: (result as any).secure_url,
        publicId: (result as any).public_id,
        format: (result as any).format,
        size: (result as any).bytes,
        duration: (result as any).duration
      }
    });
  } catch (error) {
    console.error('Audio upload error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to upload audio'
    });
  }
});

export const uploadFile = asyncHandler(async (req: IAuthRequest, res: Response) => {
  try {
    // Validate Cloudinary configuration
    validateCloudinaryConfig();
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    console.log('Uploading file:', req.file.originalname, 'Size:', req.file.size);
    
    // For general files, we'll store them in a different folder
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'chat-app/files',
          resource_type: 'raw'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('File uploaded successfully:', result?.public_id);
            resolve(result);
          }
        }
      );

      stream.end(req.file!.buffer);
    });

    return res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: (result as any).secure_url,
        publicId: (result as any).public_id,
        format: (result as any).format,
        size: (result as any).bytes,
        originalName: req.file.originalname
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to upload file'
    });
  }
});

export const deleteFile = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { publicId } = req.params;

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      return res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete file'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete file'
    });
  }
});

export const searchGifs = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { query, limit = 20, offset = 0 } = req.query;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  try {
    // Use GIPHY API for GIF search
    const giphyApiKey = process.env.GIPHY_API_KEY;
    if (!giphyApiKey) {
      return res.status(500).json({
        success: false,
        message: 'GIPHY API key not configured'
      });
    }

    const response = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=${giphyApiKey}&q=${encodeURIComponent(query as string)}&limit=${limit}&offset=${offset}`
    );

    const data = await response.json() as any;

    if (data.meta.status !== 200) {
      throw new Error('GIPHY API error');
    }

    const gifs = data.data.map((gif: any) => ({
      id: gif.id,
      title: gif.title,
      url: gif.images.original.url,
      preview: gif.images.fixed_height_small.url,
      width: gif.images.original.width,
      height: gif.images.original.height,
      size: gif.images.original.size
    }));

    return res.json({
      success: true,
      data: gifs,
      pagination: {
        total: data.pagination.total_count,
        count: data.pagination.count,
        offset: data.pagination.offset
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to search GIFs'
    });
  }
});

// Export multer middleware for use in routes
export { upload }; 