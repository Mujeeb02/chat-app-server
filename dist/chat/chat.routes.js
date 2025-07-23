"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const validationRules_1 = require("../middleware/validationRules");
const chat_controller_1 = require("./chat.controller");
const router = express_1.default.Router();
router.post('/', auth_1.authenticateToken, validationRules_1.createChatRules, validation_1.handleValidationErrors, chat_controller_1.createChat);
router.get('/', auth_1.authenticateToken, chat_controller_1.getChats);
router.get('/:chatId', auth_1.authenticateToken, validationRules_1.chatParamRules, validation_1.handleValidationErrors, chat_controller_1.getChat);
router.put('/:chatId', auth_1.authenticateToken, validationRules_1.updateChatRules, validation_1.handleValidationErrors, chat_controller_1.updateChat);
router.delete('/:chatId', auth_1.authenticateToken, validationRules_1.chatParamRules, validation_1.handleValidationErrors, chat_controller_1.deleteChat);
router.post('/:chatId/participants', auth_1.authenticateToken, validationRules_1.addParticipantRules, validation_1.handleValidationErrors, chat_controller_1.addParticipant);
router.delete('/:chatId/participants/:userId', auth_1.authenticateToken, chat_controller_1.removeParticipant);
router.post('/:chatId/admins', auth_1.authenticateToken, validationRules_1.addAdminRules, validation_1.handleValidationErrors, chat_controller_1.addAdmin);
router.delete('/:chatId/admins/:userId', auth_1.authenticateToken, chat_controller_1.removeAdmin);
router.put('/:chatId/mute', auth_1.authenticateToken, validationRules_1.chatParamRules, validation_1.handleValidationErrors, chat_controller_1.toggleMute);
router.put('/:chatId/pin', auth_1.authenticateToken, validationRules_1.chatParamRules, validation_1.handleValidationErrors, chat_controller_1.togglePin);
router.post('/:chatId/invite', auth_1.authenticateToken, validationRules_1.chatParamRules, validation_1.handleValidationErrors, chat_controller_1.generateInviteLink);
router.post('/join/:inviteToken', auth_1.authenticateToken, chat_controller_1.joinByInvite);
exports.default = router;
//# sourceMappingURL=chat.routes.js.map