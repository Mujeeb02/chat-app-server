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
const mongoose_1 = __importStar(require("mongoose"));
const chatSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        maxlength: 500,
        default: ''
    },
    type: {
        type: String,
        enum: ['direct', 'group'],
        required: true
    },
    participants: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }],
    admins: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
            default: []
        }],
    avatar: {
        type: String,
        default: null
    },
    lastMessage: {
        content: {
            type: String,
            default: ''
        },
        senderId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    unreadCount: {
        type: Map,
        of: Number,
        default: new Map()
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
chatSchema.methods.addParticipant = function (userId) {
    if (!this.participants.includes(userId)) {
        this.participants.push(userId);
    }
};
chatSchema.methods.removeParticipant = function (userId) {
    this.participants = this.participants.filter((id) => id.toString() !== userId);
    this.admins = this.admins.filter((id) => id.toString() !== userId);
};
chatSchema.methods.addAdmin = function (userId) {
    if (!this.admins.includes(userId)) {
        this.admins.push(userId);
    }
};
chatSchema.methods.removeAdmin = function (userId) {
    this.admins = this.admins.filter((id) => id.toString() !== userId);
};
chatSchema.methods.updateUnreadCount = function (userId, count) {
    this.unreadCount.set(userId, count);
};
chatSchema.pre('save', function (next) {
    if (this.type === 'group' && this.admins.length === 0 && this.participants.length > 0) {
        this.admins = [this.participants[0]];
    }
    next();
});
chatSchema.index({ participants: 1 });
chatSchema.index({ type: 1 });
chatSchema.index({ 'lastMessage.timestamp': -1 });
chatSchema.index({ isActive: 1 });
chatSchema.virtual('participantCount').get(function () {
    return this.participants.length;
});
chatSchema.methods.isParticipant = function (userId) {
    return this.participants.includes(userId);
};
chatSchema.methods.isAdmin = function (userId) {
    return this.admins.includes(userId);
};
exports.default = mongoose_1.default.model('Chat', chatSchema);
//# sourceMappingURL=Chat.js.map