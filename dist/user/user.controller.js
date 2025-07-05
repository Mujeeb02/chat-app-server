"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.deleteAccount = exports.updateOnlineStatus = exports.searchUsers = exports.getUserById = exports.getAllUsers = exports.changePassword = exports.updatePreferences = exports.updateProfile = exports.getProfile = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("./User");
const errorHandler_1 = require("../middleware/errorHandler");
const emailService_1 = require("../services/emailService");
exports.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { username, email, password, firstName, lastName } = req.body;
    const existingUser = await User_1.User.findOne({
        $or: [{ email }, { username }]
    });
    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
        });
    }
    const user = new User_1.User({
        username,
        email,
        password,
        firstName,
        lastName
    });
    await user.save();
    const accessToken = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    user.refreshTokens.push(refreshToken);
    await user.save();
    if (process.env.NODE_ENV === 'production') {
        await (0, emailService_1.sendVerificationEmail)(user.email, user._id.toString());
    }
    return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
            user: user.toJSON(),
            accessToken,
            refreshToken
        }
    });
});
exports.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    const user = await User_1.User.findOne({ email }).select('+password');
    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
    user.lastSeen = new Date();
    user.isOnline = true;
    await user.save();
    const accessToken = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    user.refreshTokens.push(refreshToken);
    await user.save();
    return res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: user.toJSON(),
            accessToken,
            refreshToken
        }
    });
});
exports.refreshToken = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({
            success: false,
            message: 'Refresh token is required'
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User_1.User.findById(decoded.userId);
        if (!user || !user.refreshTokens.includes(refreshToken)) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
        const newAccessToken = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const newRefreshToken = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
        user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
        user.refreshTokens.push(newRefreshToken);
        await user.save();
        return res.json({
            success: true,
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            }
        });
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid refresh token'
        });
    }
});
exports.logout = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { refreshToken } = req.body;
    const user = req.user;
    if (refreshToken) {
        user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
    }
    else {
        user.refreshTokens = [];
    }
    user.isOnline = false;
    user.lastSeen = new Date();
    await user.save();
    return res.json({
        success: true,
        message: 'Logged out successfully'
    });
});
exports.getProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await User_1.User.findById(req.user._id);
    return res.json({
        success: true,
        data: user
    });
});
exports.updateProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { firstName, lastName, email, username, bio, avatar, phoneNumber, location, website, socialLinks } = req.body;
    const updateData = {};
    if (firstName !== undefined)
        updateData.firstName = firstName;
    if (lastName !== undefined)
        updateData.lastName = lastName;
    if (email !== undefined)
        updateData.email = email;
    if (username !== undefined)
        updateData.username = username;
    if (bio !== undefined)
        updateData.bio = bio;
    if (avatar !== undefined)
        updateData.avatar = avatar;
    if (phoneNumber !== undefined)
        updateData.phoneNumber = phoneNumber;
    if (location !== undefined)
        updateData.location = location;
    if (website !== undefined)
        updateData.website = website;
    if (socialLinks !== undefined)
        updateData.socialLinks = socialLinks;
    if (email || username) {
        const existingUser = await User_1.User.findOne({
            $or: [
                ...(email ? [{ email }] : []),
                ...(username ? [{ username }] : [])
            ],
            _id: { $ne: req.user._id }
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
            });
        }
    }
    const user = await User_1.User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true });
    return res.json({
        success: true,
        message: 'Profile updated successfully',
        data: user
    });
});
exports.updatePreferences = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { preferences } = req.body;
    const user = await User_1.User.findByIdAndUpdate(req.user._id, { preferences }, { new: true, runValidators: true });
    return res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: user
    });
});
exports.changePassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User_1.User.findById(req.user._id).select('+password');
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
        return res.status(400).json({
            success: false,
            message: 'Current password is incorrect'
        });
    }
    user.password = newPassword;
    await user.save();
    user.refreshTokens = [];
    await user.save();
    return res.json({
        success: true,
        message: 'Password changed successfully'
    });
});
exports.getAllUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 50, search, status } = req.query;
    const query = {};
    if (search) {
        query.$or = [
            { username: { $regex: search, $options: 'i' } },
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }
    if (status) {
        query.status = status;
    }
    const skip = (Number(page) - 1) * Number(limit);
    const users = await User_1.User.find(query)
        .select('-password -refreshTokens -twoFactorSecret')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));
    const total = await User_1.User.countDocuments(query);
    return res.json({
        success: true,
        data: users,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
        }
    });
});
exports.getUserById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const user = await User_1.User.findById(userId).select('-password -refreshTokens -twoFactorSecret');
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }
    return res.json({
        success: true,
        data: user
    });
});
exports.searchUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { query } = req.params;
    const { limit = 10 } = req.query;
    const users = await User_1.User.find({
        $or: [
            { username: { $regex: query, $options: 'i' } },
            { firstName: { $regex: query, $options: 'i' } },
            { lastName: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
        ]
    })
        .select('-password -refreshTokens -twoFactorSecret')
        .limit(Number(limit));
    res.json({
        success: true,
        data: users
    });
});
exports.updateOnlineStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { status, isOnline } = req.body;
    const updateData = {};
    if (status !== undefined)
        updateData.status = status;
    if (isOnline !== undefined)
        updateData.isOnline = isOnline;
    if (isOnline === false) {
        updateData.lastSeen = new Date();
    }
    const user = await User_1.User.findByIdAndUpdate(req.user._id, updateData, { new: true });
    return res.json({
        success: true,
        data: user
    });
});
exports.deleteAccount = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { password } = req.body;
    const user = await User_1.User.findById(req.user._id).select('+password');
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        return res.status(400).json({
            success: false,
            message: 'Password is incorrect'
        });
    }
    await User_1.User.findByIdAndDelete(req.user._id);
    return res.json({
        success: true,
        message: 'Account deleted successfully'
    });
});
exports.forgotPassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    const user = await User_1.User.findOne({ email });
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }
    const resetToken = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    if (process.env.NODE_ENV === 'production') {
        await (0, emailService_1.sendPasswordResetEmail)(user.email, resetToken);
    }
    return res.json({
        success: true,
        message: 'Password reset email sent'
    });
});
exports.resetPassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await User_1.User.findById(decoded.userId);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reset token'
            });
        }
        user.password = newPassword;
        user.refreshTokens = [];
        await user.save();
        return res.json({
            success: true,
            message: 'Password reset successfully'
        });
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Invalid or expired reset token'
        });
    }
});
//# sourceMappingURL=user.controller.js.map