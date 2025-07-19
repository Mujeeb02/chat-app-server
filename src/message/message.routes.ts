import express from "express";
import { param } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { handleValidationErrors } from "../middleware/validation";
import {
  sendMessageRules,
  messageParamRules,
  editMessageRules,
  reactionRules,
  forwardMessageRules,
} from "../middleware/validationRules";
import {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  reactToMessage,
  removeReaction,
  pinMessage,
  unpinMessage,
  forwardMessage,
  markAsSeen,
  searchMessages,
} from "./message.controller";

const router = express.Router();

// All message routes require authentication
router.use(authenticateToken);

// Send message
router.post("/", sendMessageRules, handleValidationErrors, sendMessage);

// Get messages for a chat
router.get(
  "/:chatId",
  [param("chatId").isMongoId().withMessage("Invalid chat ID")],
  handleValidationErrors,
  getMessages
);

// Edit message
router.put(
  "/:messageId",
  editMessageRules,
  handleValidationErrors,
  editMessage
);

// Delete message
router.delete(
  "/:messageId",
  messageParamRules,
  handleValidationErrors,
  deleteMessage
);

// React to message
router.post(
  "/:messageId/reactions",
  reactionRules,
  handleValidationErrors,
  reactToMessage
);

// Remove reaction
router.delete(
  "/:messageId/reactions",
  reactionRules,
  handleValidationErrors,
  removeReaction
);

// Pin message
router.post(
  "/:messageId/pin",
  messageParamRules,
  handleValidationErrors,
  pinMessage
);

// Unpin message
router.delete(
  "/:messageId/pin",
  messageParamRules,
  handleValidationErrors,
  unpinMessage
);

// Forward message
router.post(
  "/:messageId/forward",
  forwardMessageRules,
  handleValidationErrors,
  forwardMessage
);

// Mark message as seen
router.post(
  "/:messageId/seen",
  messageParamRules,
  handleValidationErrors,
  markAsSeen
);

// Search messages
router.get("/search/:query", searchMessages);

export default router;
