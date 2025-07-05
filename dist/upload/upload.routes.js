"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const upload_controller_1 = require("./upload.controller");
const router = express_1.default.Router();
router.get('/test', (req, res) => {
    res.json({
        message: 'Upload route is working',
        timestamp: new Date().toISOString(),
        auth: 'This endpoint does not require authentication'
    });
});
router.get('/test-auth', auth_1.authenticateToken, (req, res) => {
    res.json({
        message: 'Upload route with auth is working',
        timestamp: new Date().toISOString(),
        user: req.user._id,
        auth: 'This endpoint requires authentication'
    });
});
router.use(auth_1.authenticateToken);
router.post('/image', upload_controller_1.upload.single('image'), upload_controller_1.uploadImage);
router.post('/video', upload_controller_1.upload.single('video'), upload_controller_1.uploadVideo);
router.post('/audio', upload_controller_1.upload.single('audio'), upload_controller_1.uploadAudio);
router.post('/file', upload_controller_1.upload.single('file'), upload_controller_1.uploadFile);
router.delete('/:publicId', upload_controller_1.deleteFile);
router.get('/giphy', upload_controller_1.searchGifs);
exports.default = router;
//# sourceMappingURL=upload.routes.js.map