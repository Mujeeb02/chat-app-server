"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const validationRules_1 = require("../middleware/validationRules");
const message_controller_1 = require("./message.controller");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
router.post("/", validationRules_1.sendMessageRules, validation_1.handleValidationErrors, message_controller_1.sendMessage);
router.get("/:chatId", [(0, express_validator_1.param)("chatId").isMongoId().withMessage("Invalid chat ID")], validation_1.handleValidationErrors, message_controller_1.getMessages);
router.put("/:messageId", validationRules_1.editMessageRules, validation_1.handleValidationErrors, message_controller_1.editMessage);
router.delete("/:messageId", validationRules_1.messageParamRules, validation_1.handleValidationErrors, message_controller_1.deleteMessage);
router.post("/:messageId/reactions", validationRules_1.reactionRules, validation_1.handleValidationErrors, message_controller_1.reactToMessage);
router.delete("/:messageId/reactions", validationRules_1.reactionRules, validation_1.handleValidationErrors, message_controller_1.removeReaction);
router.post("/:messageId/pin", validationRules_1.messageParamRules, validation_1.handleValidationErrors, message_controller_1.pinMessage);
router.delete("/:messageId/pin", validationRules_1.messageParamRules, validation_1.handleValidationErrors, message_controller_1.unpinMessage);
router.post("/:messageId/forward", validationRules_1.forwardMessageRules, validation_1.handleValidationErrors, message_controller_1.forwardMessage);
router.post("/:messageId/seen", validationRules_1.messageParamRules, validation_1.handleValidationErrors, message_controller_1.markAsSeen);
router.get("/search/:query", message_controller_1.searchMessages);
exports.default = router;
//# sourceMappingURL=message.routes.js.map