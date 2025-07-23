"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_routes_1 = __importDefault(require("./user/user.routes"));
const chat_routes_1 = __importDefault(require("./chat/chat.routes"));
const message_routes_1 = __importDefault(require("./message/message.routes"));
const upload_routes_1 = __importDefault(require("./upload/upload.routes"));
const router = express_1.default.Router();
router.use("/users", user_routes_1.default);
router.use("/chats", chat_routes_1.default);
router.use("/messages", message_routes_1.default);
router.use("/upload", upload_routes_1.default);
exports.default = router;
//# sourceMappingURL=mainRoutes.js.map