"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const chat_controller_1 = require("./chat.controller");
const router = express_1.default.Router();
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: errors.array()
        });
    }
    return next();
};
router.post('/', auth_1.authenticateToken, [
    (0, express_validator_1.body)('type')
        .isIn(['direct', 'group'])
        .withMessage('Type must be either direct or group'),
    (0, express_validator_1.body)('participants')
        .isArray({ min: 1 })
        .withMessage('At least one participant is required'),
    (0, express_validator_1.body)('participants.*')
        .isMongoId()
        .withMessage('Invalid participant ID'),
    (0, express_validator_1.body)('name')
        .if((0, express_validator_1.body)('type').equals('group'))
        .notEmpty()
        .withMessage('Group name is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Group name must be between 1 and 100 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters'),
    handleValidationErrors
], chat_controller_1.createChat);
router.get('/', auth_1.authenticateToken, chat_controller_1.getChats);
router.get('/:chatId', auth_1.authenticateToken, [
    (0, express_validator_1.body)('chatId')
        .isMongoId()
        .withMessage('Invalid chat ID'),
    handleValidationErrors
], chat_controller_1.getChat);
router.put('/:chatId', auth_1.authenticateToken, [
    (0, express_validator_1.body)('name')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Name must be between 1 and 100 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters'),
    (0, express_validator_1.body)('avatar')
        .optional()
        .isURL()
        .withMessage('Avatar must be a valid URL'),
    handleValidationErrors
], chat_controller_1.updateChat);
router.delete('/:chatId', auth_1.authenticateToken, chat_controller_1.deleteChat);
router.post('/:chatId/participants', auth_1.authenticateToken, [
    (0, express_validator_1.body)('userId')
        .isMongoId()
        .withMessage('Invalid user ID'),
    handleValidationErrors
], chat_controller_1.addParticipant);
router.delete('/:chatId/participants/:userId', auth_1.authenticateToken, chat_controller_1.removeParticipant);
router.post('/:chatId/admins', auth_1.authenticateToken, [
    (0, express_validator_1.body)('userId')
        .isMongoId()
        .withMessage('Invalid user ID'),
    handleValidationErrors
], chat_controller_1.addAdmin);
router.delete('/:chatId/admins/:userId', auth_1.authenticateToken, chat_controller_1.removeAdmin);
router.put('/:chatId/mute', auth_1.authenticateToken, chat_controller_1.toggleMute);
router.put('/:chatId/pin', auth_1.authenticateToken, chat_controller_1.togglePin);
router.post('/:chatId/invite', auth_1.authenticateToken, chat_controller_1.generateInviteLink);
router.post('/join/:inviteToken', auth_1.authenticateToken, chat_controller_1.joinByInvite);
exports.default = router;
//# sourceMappingURL=chat.routes.js.map