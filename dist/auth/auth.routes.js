"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const router = (0, express_1.Router)();
router.post('/register', auth_controller_1.register);
router.post('/login', auth_controller_1.login);
router.post('/oauth', auth_controller_1.oauthLogin);
router.get('/profile', auth_controller_1.getProfile);
router.put('/profile', auth_controller_1.updateProfile);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map