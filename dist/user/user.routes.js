"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const user_controller_1 = require("./user.controller");
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
router.post('/register', [
    (0, express_validator_1.body)('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    (0, express_validator_1.body)('firstName')
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters'),
    (0, express_validator_1.body)('lastName')
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must be between 1 and 50 characters'),
    handleValidationErrors
], user_controller_1.register);
router.post('/login', [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
], user_controller_1.login);
router.post('/refresh-token', [
    (0, express_validator_1.body)('refreshToken')
        .notEmpty()
        .withMessage('Refresh token is required'),
    handleValidationErrors
], user_controller_1.refreshToken);
router.post('/forgot-password', [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Please provide a valid email'),
    handleValidationErrors
], user_controller_1.forgotPassword);
router.post('/reset-password', [
    (0, express_validator_1.body)('token')
        .notEmpty()
        .withMessage('Reset token is required'),
    (0, express_validator_1.body)('newPassword')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    handleValidationErrors
], user_controller_1.resetPassword);
router.use(auth_1.authenticateToken);
router.post('/logout', user_controller_1.logout);
router.get('/profile', user_controller_1.getProfile);
router.put('/profile', [
    (0, express_validator_1.body)('firstName')
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters'),
    (0, express_validator_1.body)('lastName')
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must be between 1 and 50 characters'),
    (0, express_validator_1.body)('email')
        .optional()
        .isEmail()
        .withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('username')
        .optional()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    (0, express_validator_1.body)('bio')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Bio must be less than 500 characters'),
    (0, express_validator_1.body)('avatar')
        .optional()
        .custom((value) => {
        if (!value)
            return true;
        if (value.startsWith('data:')) {
            return true;
        }
        try {
            new URL(value);
            return true;
        }
        catch {
            return false;
        }
    })
        .withMessage('Avatar must be a valid URL or data URL'),
    (0, express_validator_1.body)('phoneNumber')
        .optional()
        .matches(/^\+?[\d\s\-\(\)]+$/)
        .withMessage('Please provide a valid phone number'),
    (0, express_validator_1.body)('location')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Location must be less than 100 characters'),
    (0, express_validator_1.body)('website')
        .optional()
        .isURL()
        .withMessage('Website must be a valid URL'),
    handleValidationErrors
], user_controller_1.updateProfile);
router.put('/preferences', [
    (0, express_validator_1.body)('preferences.theme')
        .optional()
        .isIn(['light', 'dark', 'auto'])
        .withMessage('Theme must be light, dark, or auto'),
    (0, express_validator_1.body)('preferences.language')
        .optional()
        .isLength({ min: 2, max: 5 })
        .withMessage('Language code must be between 2 and 5 characters'),
    handleValidationErrors
], user_controller_1.updatePreferences);
router.put('/change-password', [
    (0, express_validator_1.body)('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    (0, express_validator_1.body)('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long'),
    handleValidationErrors
], user_controller_1.changePassword);
router.put('/online-status', [
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['online', 'offline', 'away', 'busy'])
        .withMessage('Status must be online, offline, away, or busy'),
    (0, express_validator_1.body)('isOnline')
        .optional()
        .isBoolean()
        .withMessage('isOnline must be a boolean'),
    handleValidationErrors
], user_controller_1.updateOnlineStatus);
router.delete('/account', [
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required for account deletion'),
    handleValidationErrors
], user_controller_1.deleteAccount);
router.get('/', user_controller_1.getAllUsers);
router.get('/search/:query', user_controller_1.searchUsers);
router.get('/:userId', user_controller_1.getUserById);
exports.default = router;
//# sourceMappingURL=user.routes.js.map