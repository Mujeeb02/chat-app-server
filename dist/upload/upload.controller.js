"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.searchGifs = exports.deleteFile = exports.uploadFile = exports.uploadAudio = exports.uploadVideo = exports.uploadImage = void 0;
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
const errorHandler_1 = require("../middleware/errorHandler");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const validateCloudinaryConfig = () => {
    const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing Cloudinary configuration: ${missing.join(', ')}`);
    }
};
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav', 'application/pdf', 'text/plain'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type'));
        }
    }
});
exports.upload = upload;
exports.uploadImage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        validateCloudinaryConfig();
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }
        console.log('Uploading image:', req.file.originalname, 'Size:', req.file.size);
        console.log('User ID:', req.user?._id);
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary_1.v2.uploader.upload_stream({
                folder: 'chat-app/images',
                resource_type: 'image',
                transformation: [
                    { width: 800, height: 800, crop: 'limit' },
                    { quality: 'auto' }
                ]
            }, (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(error);
                }
                else {
                    console.log('Image uploaded successfully:', result?.public_id);
                    resolve(result);
                }
            });
            stream.end(req.file.buffer);
        });
        return res.json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format,
                size: result.bytes
            }
        });
    }
    catch (error) {
        console.error('Image upload error:', error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to upload image'
        });
    }
});
exports.uploadVideo = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        validateCloudinaryConfig();
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No video file provided'
            });
        }
        console.log('Uploading video:', req.file.originalname, 'Size:', req.file.size);
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary_1.v2.uploader.upload_stream({
                folder: 'chat-app/videos',
                resource_type: 'video',
                transformation: [
                    { width: 640, height: 480, crop: 'limit' },
                    { quality: 'auto' }
                ]
            }, (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(error);
                }
                else {
                    console.log('Video uploaded successfully:', result?.public_id);
                    resolve(result);
                }
            });
            stream.end(req.file.buffer);
        });
        return res.json({
            success: true,
            message: 'Video uploaded successfully',
            data: {
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format,
                size: result.bytes,
                duration: result.duration
            }
        });
    }
    catch (error) {
        console.error('Video upload error:', error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to upload video'
        });
    }
});
exports.uploadAudio = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        validateCloudinaryConfig();
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No audio file provided'
            });
        }
        console.log('Uploading audio:', req.file.originalname, 'Size:', req.file.size);
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary_1.v2.uploader.upload_stream({
                folder: 'chat-app/audio',
                resource_type: 'video',
                transformation: [
                    { quality: 'auto' }
                ]
            }, (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(error);
                }
                else {
                    console.log('Audio uploaded successfully:', result?.public_id);
                    resolve(result);
                }
            });
            stream.end(req.file.buffer);
        });
        return res.json({
            success: true,
            message: 'Audio uploaded successfully',
            data: {
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                size: result.bytes,
                duration: result.duration
            }
        });
    }
    catch (error) {
        console.error('Audio upload error:', error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to upload audio'
        });
    }
});
exports.uploadFile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        validateCloudinaryConfig();
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file provided'
            });
        }
        console.log('Uploading file:', req.file.originalname, 'Size:', req.file.size);
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary_1.v2.uploader.upload_stream({
                folder: 'chat-app/files',
                resource_type: 'raw'
            }, (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(error);
                }
                else {
                    console.log('File uploaded successfully:', result?.public_id);
                    resolve(result);
                }
            });
            stream.end(req.file.buffer);
        });
        return res.json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                size: result.bytes,
                originalName: req.file.originalname
            }
        });
    }
    catch (error) {
        console.error('File upload error:', error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to upload file'
        });
    }
});
exports.deleteFile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { publicId } = req.params;
    try {
        const result = await cloudinary_1.v2.uploader.destroy(publicId);
        if (result.result === 'ok') {
            return res.json({
                success: true,
                message: 'File deleted successfully'
            });
        }
        else {
            return res.status(400).json({
                success: false,
                message: 'Failed to delete file'
            });
        }
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to delete file'
        });
    }
});
exports.searchGifs = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { query, limit = 20, offset = 0 } = req.query;
    if (!query) {
        return res.status(400).json({
            success: false,
            message: 'Search query is required'
        });
    }
    try {
        const giphyApiKey = process.env.GIPHY_API_KEY;
        if (!giphyApiKey) {
            return res.status(500).json({
                success: false,
                message: 'GIPHY API key not configured'
            });
        }
        const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${giphyApiKey}&q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`);
        const data = await response.json();
        if (data.meta.status !== 200) {
            throw new Error('GIPHY API error');
        }
        const gifs = data.data.map((gif) => ({
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to search GIFs'
        });
    }
});
//# sourceMappingURL=upload.controller.js.map