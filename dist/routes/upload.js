"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
const axios_1 = __importDefault(require("axios"));
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760')
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,video/mp4,audio/mpeg,application/pdf').split(',');
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type'));
        }
    }
});
router.post('/image', upload.single('image'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No image file provided' });
    }
    try {
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary_1.v2.uploader.upload_stream({
                folder: 'chat-app/images',
                resource_type: 'auto'
            }, (error, result) => {
                if (error)
                    reject(error);
                else
                    resolve(result);
            });
            stream.end(req.file.buffer);
        });
        res.json({
            success: true,
            data: {
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                size: result.bytes
            }
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, error: 'Upload failed' });
    }
}));
router.post('/file', upload.single('file'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file provided' });
    }
    try {
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary_1.v2.uploader.upload_stream({
                folder: 'chat-app/files',
                resource_type: 'auto'
            }, (error, result) => {
                if (error)
                    reject(error);
                else
                    resolve(result);
            });
            stream.end(req.file.buffer);
        });
        res.json({
            success: true,
            data: {
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                size: result.bytes,
                fileName: req.file.originalname
            }
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, error: 'Upload failed' });
    }
}));
router.get('/giphy', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { query, limit = 20, offset = 0 } = req.query;
    if (!query) {
        return res.status(400).json({ success: false, error: 'Search query is required' });
    }
    try {
        const response = await axios_1.default.get('https://api.giphy.com/v1/gifs/search', {
            params: {
                api_key: process.env.GIPHY_API_KEY,
                q: query,
                limit,
                offset,
                rating: 'g'
            }
        });
        const gifs = response.data.data.map((gif) => ({
            id: gif.id,
            url: gif.images.original.url,
            title: gif.title,
            width: gif.images.original.width,
            height: gif.images.original.height
        }));
        res.json({
            success: true,
            data: {
                gifs,
                pagination: response.data.pagination
            }
        });
    }
    catch (error) {
        console.error('Giphy API error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch GIFs' });
    }
}));
exports.default = router;
//# sourceMappingURL=upload.js.map