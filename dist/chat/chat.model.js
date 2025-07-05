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
    type: {
        type: String,
        enum: ['direct', 'group'],
        required: true
    },
    name: {
        type: String,
        required: function () {
            return this.type === 'group';
        },
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        maxlength: 500,
        default: ''
    },
    avatar: {
        type: String,
        default: null
    },
    participants: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }],
    admins: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }],
    lastMessage: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    unreadCount: {
        type: Map,
        of: Number,
        default: new Map()
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    isMuted: {
        type: Map,
        of: Boolean,
        default: new Map()
    },
    theme: {
        type: String,
        default: 'default'
    },
    inviteLink: {
        type: String,
        default: null
    },
    settings: {
        onlyAdminsCanSendMessages: {
            type: Boolean,
            default: false
        },
        onlyAdminsCanEditInfo: {
            type: Boolean,
            default: false
        },
        onlyAdminsCanAddParticipants: {
            type: Boolean,
            default: false
        },
        onlyAdminsCanRemoveParticipants: {
            type: Boolean,
            default: false
        },
        onlyAdminsCanPinMessages: {
            type: Boolean,
            default: false
        },
        onlyAdminsCanDeleteMessages: {
            type: Boolean,
            default: false
        }
    },
    pinnedMessages: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Message'
        }]
}, {
    timestamps: true
});
chatSchema.index({ participants: 1 });
chatSchema.index({ type: 1 });
chatSchema.index({ lastMessage: 1 });
chatSchema.index({ createdAt: -1 });
chatSchema.index({ 'unreadCount.userId': 1 });
chatSchema.virtual('otherUser', {
    ref: 'User',
    localField: 'participants',
    foreignField: '_id',
    justOne: true
});
chatSchema.pre('save', function (next) {
    if (this.type === 'direct' && this.participants.length !== 2) {
        return next(new Error('Direct chats must have exactly 2 participants'));
    }
    if (this.type === 'group' && this.participants.length < 2) {
        return next(new Error('Group chats must have at least 2 participants'));
    }
    const adminIds = this.admins.map(admin => admin.toString());
    const participantIds = this.participants.map(participant => participant.toString());
    const invalidAdmins = adminIds.filter(adminId => !participantIds.includes(adminId));
    if (invalidAdmins.length > 0) {
        return next(new Error('All admins must be participants'));
    }
    next();
});
chatSchema.methods.isParticipant = function (userId) {
    return this.participants.some((participant) => participant.toString() === userId);
};
chatSchema.methods.isAdmin = function (userId) {
    return this.admins.some((admin) => admin.toString() === userId);
};
chatSchema.methods.canSendMessages = function (userId) {
    if (!this.isParticipant(userId))
        return false;
    if (!this.settings.onlyAdminsCanSendMessages)
        return true;
    return this.isAdmin(userId);
};
chatSchema.methods.canEditInfo = function (userId) {
    if (!this.isParticipant(userId))
        return false;
    if (!this.settings.onlyAdminsCanEditInfo)
        return true;
    return this.isAdmin(userId);
};
chatSchema.methods.canAddParticipants = function (userId) {
    if (!this.isParticipant(userId))
        return false;
    if (!this.settings.onlyAdminsCanAddParticipants)
        return true;
    return this.isAdmin(userId);
};
chatSchema.methods.canRemoveParticipants = function (userId) {
    if (!this.isParticipant(userId))
        return false;
    if (!this.settings.onlyAdminsCanRemoveParticipants)
        return true;
    return this.isAdmin(userId);
};
chatSchema.methods.canPinMessages = function (userId) {
    if (!this.isParticipant(userId))
        return false;
    if (!this.settings.onlyAdminsCanPinMessages)
        return true;
    return this.isAdmin(userId);
};
chatSchema.methods.canDeleteMessages = function (userId) {
    if (!this.isParticipant(userId))
        return false;
    if (!this.settings.onlyAdminsCanDeleteMessages)
        return true;
    return this.isAdmin(userId);
};
chatSchema.methods.addParticipant = function (userId) {
    if (this.participants.includes(userId))
        return false;
    this.participants.push(userId);
    return true;
};
chatSchema.methods.removeParticipant = function (userId) {
    const index = this.participants.indexOf(userId);
    if (index === -1)
        return false;
    this.participants.splice(index, 1);
    const adminIndex = this.admins.indexOf(userId);
    if (adminIndex !== -1) {
        this.admins.splice(adminIndex, 1);
    }
    return true;
};
chatSchema.methods.addAdmin = function (userId) {
    if (!this.isParticipant(userId))
        return false;
    if (this.admins.includes(userId))
        return false;
    this.admins.push(userId);
    return true;
};
chatSchema.methods.removeAdmin = function (userId) {
    const index = this.admins.indexOf(userId);
    if (index === -1)
        return false;
    this.admins.splice(index, 1);
    return true;
};
chatSchema.methods.updateUnreadCount = function (userId, increment = true) {
    const currentCount = this.unreadCount.get(userId) || 0;
    this.unreadCount.set(userId, increment ? currentCount + 1 : Math.max(0, currentCount - 1));
};
chatSchema.methods.resetUnreadCount = function (userId) {
    this.unreadCount.set(userId, 0);
};
chatSchema.methods.toggleMute = function (userId) {
    const currentMute = this.isMuted.get(userId) || false;
    this.isMuted.set(userId, !currentMute);
    return !currentMute;
};
chatSchema.methods.pinMessage = function (messageId) {
    if (this.pinnedMessages.includes(messageId))
        return false;
    this.pinnedMessages.push(messageId);
    return true;
};
chatSchema.methods.unpinMessage = function (messageId) {
    const index = this.pinnedMessages.indexOf(messageId);
    if (index === -1)
        return false;
    this.pinnedMessages.splice(index, 1);
    return true;
};
exports.default = mongoose_1.default.model('Chat', chatSchema);
//# sourceMappingURL=chat.model.js.map