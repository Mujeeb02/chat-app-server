"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const User_1 = __importDefault(require("../models/User"));
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
router.get('/profile', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await User_1.default.findById(req.user._id).select('-password');
    res.json({
        success: true,
        data: user
    });
}));
router.put('/profile', [
    (0, express_validator_1.body)('firstName')
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters'),
    (0, express_validator_1.body)('lastName')
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must be between 1 and 50 characters'),
    (0, express_validator_1.body)('bio')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Bio must be less than 500 characters'),
    (0, express_validator_1.body)('avatar')
        .optional()
        .isURL()
        .withMessage('Avatar must be a valid URL')
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: errors.array()
        });
    }
    const { firstName, lastName, bio, avatar } = req.body;
    const updateData = {};
    if (firstName !== undefined)
        updateData.firstName = firstName;
    if (lastName !== undefined)
        updateData.lastName = lastName;
    if (bio !== undefined)
        updateData.bio = bio;
    if (avatar !== undefined)
        updateData.avatar = avatar;
    const user = await User_1.default.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true }).select('-password');
    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: user
    });
}));
router.get('/:userId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await User_1.default.findById(req.params.userId).select('-password');
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user });
}));
router.get('/search/:query', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { query } = req.params;
    const users = await User_1.default.find({
        $or: [
            { username: { $regex: query, $options: 'i' } },
            { firstName: { $regex: query, $options: 'i' } },
            { lastName: { $regex: query, $options: 'i' } }
        ]
    }).select('-password').limit(10);
    res.json({ success: true, data: users });
}));
exports.default = router;
//# sourceMappingURL=users.js.map