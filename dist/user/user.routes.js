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
const user_controller_1 = require("./user.controller");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
router.post('/logout', user_controller_1.logout);
router.get('/profile', user_controller_1.getProfile);
router.put('/profile', validationRules_1.updateProfileRules, validation_1.handleValidationErrors, user_controller_1.updateProfile);
router.put('/preferences', [
    (0, express_validator_1.body)('preferences.theme')
        .optional()
        .isIn(['light', 'dark', 'auto'])
        .withMessage('Theme must be light, dark, or auto'),
    (0, express_validator_1.body)('preferences.language')
        .optional()
        .isLength({ min: 2, max: 5 })
        .withMessage('Language code must be between 2 and 5 characters')
], validation_1.handleValidationErrors, user_controller_1.updatePreferences);
router.put('/change-password', validationRules_1.changePasswordRules, validation_1.handleValidationErrors, user_controller_1.changePassword);
router.put('/online-status', [
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['online', 'offline', 'away', 'busy'])
        .withMessage('Status must be online, offline, away, or busy'),
    (0, express_validator_1.body)('isOnline')
        .optional()
        .isBoolean()
        .withMessage('isOnline must be a boolean')
], validation_1.handleValidationErrors, user_controller_1.updateOnlineStatus);
router.delete('/account', [(0, express_validator_1.body)('password').notEmpty().withMessage('Password is required for account deletion')], validation_1.handleValidationErrors, user_controller_1.deleteAccount);
router.get('/', user_controller_1.getAllUsers);
router.get('/search/:query', user_controller_1.searchUsers);
router.get('/:userId', validationRules_1.userParamRules, validation_1.handleValidationErrors, user_controller_1.getUserById);
exports.default = router;
//# sourceMappingURL=user.routes.js.map