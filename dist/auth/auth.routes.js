"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const validationRules_1 = require("../middleware/validationRules");
const user_controller_1 = require("../user/user.controller");
const auth_controller_1 = require("./auth.controller");
const router = (0, express_1.Router)();
router.post('/register', validationRules_1.registerRules, validation_1.handleValidationErrors, user_controller_1.register);
router.post('/login', validationRules_1.loginRules, validation_1.handleValidationErrors, user_controller_1.login);
router.post('/refresh-token', validationRules_1.refreshTokenRules, validation_1.handleValidationErrors, user_controller_1.refreshToken);
router.post('/forgot-password', [(0, express_validator_1.body)('email').isEmail().withMessage('Please provide a valid email')], validation_1.handleValidationErrors, user_controller_1.forgotPassword);
router.post('/reset-password', [
    (0, express_validator_1.body)('token').notEmpty().withMessage('Reset token is required'),
    (0, express_validator_1.body)('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], validation_1.handleValidationErrors, user_controller_1.resetPassword);
router.post('/oauth', auth_controller_1.oauthLogin);
router.post('/logout', auth_1.authenticateToken, user_controller_1.logout);
router.get('/profile', auth_1.authenticateToken, user_controller_1.getProfile);
router.put('/profile', auth_1.authenticateToken, user_controller_1.updateProfile);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map