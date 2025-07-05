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
const messageSchema = new mongoose_1.Schema({
    content: {
        type: String,
        required: function () {
            return this.type === 'text' || this.type === 'gif' || this.type === 'location';
        },
        trim: true,
        maxlength: 5000
    },
    type: {
        type: String,
        enum: ['text', 'image', 'video', 'audio', 'file', 'gif', 'location'],
        default: 'text'
    },
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    chatId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    replyTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    reactions: [{
            emoji: {
                type: String,
                required: true
            },
            user: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
    isEdited: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    isForwarded: {
        type: Boolean,
        default: false
    },
    forwardedFrom: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    mediaUrl: {
        type: String,
        required: function () {
            return ['image', 'video', 'audio', 'file'].includes(this.type);
        }
    },
    mediaType: {
        type: String,
        default: null
    },
    mediaSize: {
        type: Number,
        default: null
    },
    mediaDuration: {
        type: Number,
        default: null
    },
    fileName: {
        type: String,
        default: null
    },
    location: {
        latitude: {
            type: Number,
            required: function () {
                return this.type === 'location';
            }
        },
        longitude: {
            type: Number,
            required: function () {
                return this.type === 'location';
            }
        },
        address: {
            type: String,
            required: function () {
                return this.type === 'location';
            }
        }
    },
    seenBy: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }],
    deliveredTo: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }]
}, {
    timestamps: true
});
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ type: 1 });
messageSchema.index({ isPinned: 1 });
messageSchema.index({ 'reactions.user': 1 });
messageSchema.pre('save', function (next) {
    if (this.type === 'location' && (!this.location || !this.location.latitude || !this.location.longitude)) {
        return next(new Error('Location data is required for location type messages'));
    }
    if (['image', 'video', 'audio', 'file'].includes(this.type) && !this.mediaUrl) {
        return next(new Error('Media URL is required for media type messages'));
    }
    next();
});
messageSchema.methods.addReaction = function (userId, emoji) {
    const existingReaction = this.reactions.find((reaction) => reaction.user.toString() === userId && reaction.emoji === emoji);
    if (existingReaction) {
        return false;
    }
    this.reactions.push({
        emoji,
        user: userId,
        createdAt: new Date()
    });
    return true;
};
messageSchema.methods.removeReaction = function (userId, emoji) {
    const initialLength = this.reactions.length;
    this.reactions = this.reactions.filter((reaction) => !(reaction.user.toString() === userId && reaction.emoji === emoji));
    return this.reactions.length < initialLength;
};
messageSchema.methods.markAsSeen = function (userId) {
    if (this.seenBy.includes(userId)) {
        return false;
    }
    this.seenBy.push(userId);
    return true;
};
messageSchema.methods.markAsDelivered = function (userId) {
    if (this.deliveredTo.includes(userId)) {
        return false;
    }
    this.deliveredTo.push(userId);
    return true;
};
messageSchema.methods.edit = function (newContent) {
    this.content = newContent;
    this.isEdited = true;
};
messageSchema.methods.delete = function () {
    this.isDeleted = true;
    this.content = 'This message was deleted';
};
messageSchema.methods.pin = function () {
    this.isPinned = true;
};
messageSchema.methods.unpin = function () {
    this.isPinned = false;
};
messageSchema.methods.forward = function () {
    this.isForwarded = true;
};
messageSchema.virtual('reactionCount').get(function () {
    return this.reactions.length;
});
messageSchema.virtual('seenCount').get(function () {
    return this.seenBy.length;
});
messageSchema.virtual('deliveredCount').get(function () {
    return this.deliveredTo.length;
});
exports.default = mongoose_1.default.model('Message', messageSchema);
//# sourceMappingURL=message.model.js.map