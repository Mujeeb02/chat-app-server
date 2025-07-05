"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.optionalAuth = exports.authenticateRefreshToken = exports.authenticateToken = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const User_1 = require("../user/User");
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        console.log('Auth check for:', req.path, 'Token present:', !!token);
        if (!token) {
            res.status(401).json({ success: false, error: 'Access token required' });
            return;
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User_1.User.findById(decoded.userId).select('-password');
        console.log('User found:', user ? 'yes' : 'no', 'User ID:', decoded.userId);
        if (!user) {
            res.status(401).json({ success: false, error: 'Invalid token' });
            return;
        }
        req.user = user.toObject();
        next();
    }
    catch (error) {
        console.log('Auth error:', error);
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ success: false, error: 'Invalid token' });
            return;
        }
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ success: false, error: 'Token expired' });
            return;
        }
        res.status(500).json({ success: false, error: 'Authentication error' });
    }
};
exports.authenticateToken = authenticateToken;
const authenticateRefreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(401).json({ success: false, error: 'Refresh token required' });
            return;
        }
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User_1.User.findById(decoded.userId);
        if (!user || user.refreshToken !== refreshToken) {
            res.status(401).json({ success: false, error: 'Invalid refresh token' });
            return;
        }
        req.body.userId = decoded.userId;
        next();
    }
    catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ success: false, error: 'Invalid refresh token' });
            return;
        }
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ success: false, error: 'Refresh token expired' });
            return;
        }
        res.status(500).json({ success: false, error: 'Authentication error' });
    }
};
exports.authenticateRefreshToken = authenticateRefreshToken;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            next();
            return;
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User_1.User.findById(decoded.userId).select('-password');
        if (user) {
            req.user = user.toObject();
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=auth.js.map