"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const message_controller_1 = require("./message.controller");
const router = express_1.default.Router();
const handleValidationErrors = (req, res, next) => {
    console.log('Validation check for:', req.path, req.method);
    console.log('Request body:', req.body);
    console.log('Request params:', req.params);
    console.log('Request query:', req.query);
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: errors.array()
        });
    }
    console.log('Validation passed');
    return next();
};
router.use(auth_1.authenticateToken);
router.post('/', [
    (0, express_validator_1.body)('chatId')
        .isMongoId()
        .withMessage('Invalid chat ID'),
    (0, express_validator_1.body)('content')
        .custom((value, { req }) => {
        const messageType = req.body.type || 'text';
        if (['text', 'gif', 'location'].includes(messageType) && !value) {
            throw new Error('Message content is required for text messages');
        }
        return true;
    })
        .isLength({ max: 5000 })
        .withMessage('Message content must be less than 5000 characters'),
    (0, express_validator_1.body)('type')
        .optional()
        .isIn(['text', 'image', 'video', 'audio', 'file', 'gif', 'location'])
        .withMessage('Invalid message type'),
    (0, express_validator_1.body)('replyTo')
        .optional()
        .isMongoId()
        .withMessage('Invalid reply message ID'),
    (0, express_validator_1.body)('mediaUrl')
        .custom((value, { req }) => {
        const messageType = req.body.type || 'text';
        if (['image', 'video', 'audio', 'file'].includes(messageType) && !value) {
            throw new Error('Media URL is required for media messages');
        }
        return true;
    })
        .optional()
        .isURL()
        .withMessage('Media URL must be a valid URL'),
    (0, express_validator_1.body)('mediaSize')
        .optional()
        .isNumeric()
        .withMessage('Media size must be a number'),
    (0, express_validator_1.body)('mediaDuration')
        .optional()
        .isNumeric()
        .withMessage('Media duration must be a number'),
    (0, express_validator_1.body)('fileName')
        .optional()
        .isLength({ max: 255 })
        .withMessage('File name must be less than 255 characters'),
    (0, express_validator_1.body)('location.latitude')
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be between -90 and 90'),
    (0, express_validator_1.body)('location.longitude')
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be between -180 and 180'),
    (0, express_validator_1.body)('location.address')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Address must be less than 500 characters'),
    handleValidationErrors
], message_controller_1.sendMessage);
router.get('/:chatId', [
    (0, express_validator_1.param)('chatId')
        .isMongoId()
        .withMessage('Invalid chat ID'),
    handleValidationErrors
], message_controller_1.getMessages);
router.put('/:messageId', [
    (0, express_validator_1.body)('content')
        .notEmpty()
        .withMessage('Message content is required')
        .isLength({ max: 5000 })
        .withMessage('Message content must be less than 5000 characters'),
    handleValidationErrors
], message_controller_1.editMessage);
router.delete('/:messageId', message_controller_1.deleteMessage);
router.post('/:messageId/reactions', [
    (0, express_validator_1.body)('emoji')
        .notEmpty()
        .withMessage('Emoji is required')
        .isLength({ max: 10 })
        .withMessage('Emoji must be less than 10 characters'),
    handleValidationErrors
], message_controller_1.reactToMessage);
router.delete('/:messageId/reactions', [
    (0, express_validator_1.body)('emoji')
        .notEmpty()
        .withMessage('Emoji is required'),
    handleValidationErrors
], message_controller_1.removeReaction);
router.post('/:messageId/pin', message_controller_1.pinMessage);
router.delete('/:messageId/pin', message_controller_1.unpinMessage);
router.post('/:messageId/forward', [
    (0, express_validator_1.body)('chatIds')
        .isArray({ min: 1 })
        .withMessage('At least one target chat is required'),
    (0, express_validator_1.body)('chatIds.*')
        .isMongoId()
        .withMessage('Invalid chat ID'),
    handleValidationErrors
], message_controller_1.forwardMessage);
router.post('/:messageId/seen', message_controller_1.markAsSeen);
router.get('/search/:query', message_controller_1.searchMessages);
exports.default = router;
//# sourceMappingURL=message.routes.js.map