import mongoose, { Document, Schema } from 'mongoose';

export interface IChat extends Document {
  type: 'direct' | 'group';
  name?: string;
  description?: string;
  avatar?: string;
  participants: mongoose.Types.ObjectId[];
  admins: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  unreadCount: Record<string, number>;
  isArchived: boolean;
  isPinned: boolean;
  isMuted: Record<string, boolean>;
  theme?: string;
  inviteLink?: string;
  settings: {
    onlyAdminsCanSendMessages: boolean;
    onlyAdminsCanEditInfo: boolean;
    onlyAdminsCanAddParticipants: boolean;
    onlyAdminsCanRemoveParticipants: boolean;
    onlyAdminsCanPinMessages: boolean;
    onlyAdminsCanDeleteMessages: boolean;
  };
  pinnedMessages: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  isParticipant(userId: string): boolean;
  isAdmin(userId: string): boolean;
  canSendMessages(userId: string): boolean;
  canEditInfo(userId: string): boolean;
  canAddParticipants(userId: string): boolean;
  canRemoveParticipants(userId: string): boolean;
  canPinMessages(userId: string): boolean;
  canDeleteMessages(userId: string): boolean;
  addParticipant(userId: string): boolean;
  removeParticipant(userId: string): boolean;
  addAdmin(userId: string): boolean;
  removeAdmin(userId: string): boolean;
  updateUnreadCount(userId: string, increment?: boolean): void;
  resetUnreadCount(userId: string): void;
  toggleMute(userId: string): boolean;
  pinMessage(messageId: string): boolean;
  unpinMessage(messageId: string): boolean;
}

const chatSchema = new Schema<IChat>({
  type: {
    type: String,
    enum: ['direct', 'group'],
    required: true
  },
  name: {
    type: String,
    required: function() {
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
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  admins: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: Schema.Types.ObjectId,
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
    type: Schema.Types.ObjectId,
    ref: 'Message'
  }]
}, {
  timestamps: true
});

// Indexes
chatSchema.index({ participants: 1 });
chatSchema.index({ type: 1 });
chatSchema.index({ lastMessage: 1 });
chatSchema.index({ createdAt: -1 });
chatSchema.index({ 'unreadCount.userId': 1 });

// Virtual for direct chat other user
chatSchema.virtual('otherUser', {
  ref: 'User',
  localField: 'participants',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware
chatSchema.pre('save', function(next) {
  // For direct chats, ensure only 2 participants
  if (this.type === 'direct' && this.participants.length !== 2) {
    return next(new Error('Direct chats must have exactly 2 participants'));
  }
  
  // For group chats, ensure at least 2 participants
  if (this.type === 'group' && this.participants.length < 2) {
    return next(new Error('Group chats must have at least 2 participants'));
  }
  
  // Ensure admins are participants
  const adminIds = this.admins.map(admin => admin.toString());
  const participantIds = this.participants.map(participant => participant.toString());
  
  const invalidAdmins = adminIds.filter(adminId => !participantIds.includes(adminId));
  if (invalidAdmins.length > 0) {
    return next(new Error('All admins must be participants'));
  }
  
  next();
});

// Method to check if user is participant
chatSchema.methods.isParticipant = function(userId: string): boolean {
  return this.participants.some((participant: any) => participant.toString() === userId);
};

// Method to check if user is admin
chatSchema.methods.isAdmin = function(userId: string): boolean {
  return this.admins.some((admin: any) => admin.toString() === userId);
};

// Method to check if user can send messages
chatSchema.methods.canSendMessages = function(userId: string): boolean {
  if (!this.isParticipant(userId)) return false;
  if (!this.settings.onlyAdminsCanSendMessages) return true;
  return this.isAdmin(userId);
};

// Method to check if user can edit chat info
chatSchema.methods.canEditInfo = function(userId: string): boolean {
  if (!this.isParticipant(userId)) return false;
  if (!this.settings.onlyAdminsCanEditInfo) return true;
  return this.isAdmin(userId);
};

// Method to check if user can add participants
chatSchema.methods.canAddParticipants = function(userId: string): boolean {
  if (!this.isParticipant(userId)) return false;
  if (!this.settings.onlyAdminsCanAddParticipants) return true;
  return this.isAdmin(userId);
};

// Method to check if user can remove participants
chatSchema.methods.canRemoveParticipants = function(userId: string): boolean {
  if (!this.isParticipant(userId)) return false;
  if (!this.settings.onlyAdminsCanRemoveParticipants) return true;
  return this.isAdmin(userId);
};

// Method to check if user can pin messages
chatSchema.methods.canPinMessages = function(userId: string): boolean {
  if (!this.isParticipant(userId)) return false;
  if (!this.settings.onlyAdminsCanPinMessages) return true;
  return this.isAdmin(userId);
};

// Method to check if user can delete messages
chatSchema.methods.canDeleteMessages = function(userId: string): boolean {
  if (!this.isParticipant(userId)) return false;
  if (!this.settings.onlyAdminsCanDeleteMessages) return true;
  return this.isAdmin(userId);
};

// Method to add participant
chatSchema.methods.addParticipant = function(userId: string): boolean {
  if (this.participants.includes(userId)) return false;
  this.participants.push(userId);
  return true;
};

// Method to remove participant
chatSchema.methods.removeParticipant = function(userId: string): boolean {
  const index = this.participants.indexOf(userId);
  if (index === -1) return false;
  this.participants.splice(index, 1);
  
  // Remove from admins if they were an admin
  const adminIndex = this.admins.indexOf(userId);
  if (adminIndex !== -1) {
    this.admins.splice(adminIndex, 1);
  }
  
  return true;
};

// Method to add admin
chatSchema.methods.addAdmin = function(userId: string): boolean {
  if (!this.isParticipant(userId)) return false;
  if (this.admins.includes(userId)) return false;
  this.admins.push(userId);
  return true;
};

// Method to remove admin
chatSchema.methods.removeAdmin = function(userId: string): boolean {
  const index = this.admins.indexOf(userId);
  if (index === -1) return false;
  this.admins.splice(index, 1);
  return true;
};

// Method to update unread count
chatSchema.methods.updateUnreadCount = function(userId: string, increment: boolean = true): void {
  const currentCount = this.unreadCount.get(userId) || 0;
  this.unreadCount.set(userId, increment ? currentCount + 1 : Math.max(0, currentCount - 1));
};

// Method to reset unread count
chatSchema.methods.resetUnreadCount = function(userId: string): void {
  this.unreadCount.set(userId, 0);
};

// Method to toggle mute
chatSchema.methods.toggleMute = function(userId: string): boolean {
  const currentMute = this.isMuted.get(userId) || false;
  this.isMuted.set(userId, !currentMute);
  return !currentMute;
};

// Method to pin message
chatSchema.methods.pinMessage = function(messageId: string): boolean {
  if (this.pinnedMessages.includes(messageId)) return false;
  this.pinnedMessages.push(messageId);
  return true;
};

// Method to unpin message
chatSchema.methods.unpinMessage = function(messageId: string): boolean {
  const index = this.pinnedMessages.indexOf(messageId);
  if (index === -1) return false;
  this.pinnedMessages.splice(index, 1);
  return true;
};

export default mongoose.model<IChat>('Chat', chatSchema); 