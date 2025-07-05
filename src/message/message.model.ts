import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'gif' | 'location';
  sender: mongoose.Types.ObjectId;
  chatId: mongoose.Types.ObjectId;
  replyTo?: mongoose.Types.ObjectId;
  reactions: Array<{
    emoji: string;
    user: mongoose.Types.ObjectId;
    createdAt: Date;
  }>;
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  isForwarded: boolean;
  forwardedFrom?: mongoose.Types.ObjectId;
  mediaUrl?: string;
  mediaType?: string;
  mediaSize?: number;
  mediaDuration?: number;
  fileName?: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  seenBy: mongoose.Types.ObjectId[];
  deliveredTo: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  addReaction(userId: string, emoji: string): boolean;
  removeReaction(userId: string, emoji: string): boolean;
  markAsSeen(userId: string): boolean;
  markAsDelivered(userId: string): boolean;
  edit(newContent: string): void;
  delete(): void;
  pin(): void;
  unpin(): void;
  forward(): void;
}

const messageSchema = new Schema<IMessage>({
  content: {
    type: String,
    required: function() {
      // Content is required for text messages, optional for media types
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
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chatId: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  reactions: [{
    emoji: {
      type: String,
      required: true
    },
    user: {
      type: Schema.Types.ObjectId,
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
    type: Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  mediaUrl: {
    type: String,
    required: function() {
      // Media URL is required for media types
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
      required: function() {
        return this.type === 'location';
      }
    },
    longitude: {
      type: Number,
      required: function() {
        return this.type === 'location';
      }
    },
    address: {
      type: String,
      required: function() {
        return this.type === 'location';
      }
    }
  },
  seenBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  deliveredTo: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Indexes
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ type: 1 });
messageSchema.index({ isPinned: 1 });
messageSchema.index({ 'reactions.user': 1 });

// Pre-save middleware
messageSchema.pre('save', function(next) {
  // For location type, ensure location data is present
  if (this.type === 'location' && (!this.location || !this.location.latitude || !this.location.longitude)) {
    return next(new Error('Location data is required for location type messages'));
  }
  
  // For media types, ensure mediaUrl is present
  if (['image', 'video', 'audio', 'file'].includes(this.type) && !this.mediaUrl) {
    return next(new Error('Media URL is required for media type messages'));
  }
  
  next();
});

// Method to add reaction
messageSchema.methods.addReaction = function(userId: string, emoji: string): boolean {
  // Check if user already reacted with this emoji
  const existingReaction = this.reactions.find(
    (reaction: any) => reaction.user.toString() === userId && reaction.emoji === emoji
  );
  
  if (existingReaction) {
    return false; // Already reacted
  }
  
  this.reactions.push({
    emoji,
    user: userId,
    createdAt: new Date()
  });
  
  return true;
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId: string, emoji: string): boolean {
  const initialLength = this.reactions.length;
  this.reactions = this.reactions.filter(
    (reaction: any) => !(reaction.user.toString() === userId && reaction.emoji === emoji)
  );
  
  return this.reactions.length < initialLength;
};

// Method to mark as seen
messageSchema.methods.markAsSeen = function(userId: string): boolean {
  if (this.seenBy.includes(userId)) {
    return false; // Already seen
  }
  
  this.seenBy.push(userId);
  return true;
};

// Method to mark as delivered
messageSchema.methods.markAsDelivered = function(userId: string): boolean {
  if (this.deliveredTo.includes(userId)) {
    return false; // Already delivered
  }
  
  this.deliveredTo.push(userId);
  return true;
};

// Method to edit message
messageSchema.methods.edit = function(newContent: string): void {
  this.content = newContent;
  this.isEdited = true;
};

// Method to delete message
messageSchema.methods.delete = function(): void {
  this.isDeleted = true;
  this.content = 'This message was deleted';
};

// Method to pin message
messageSchema.methods.pin = function(): void {
  this.isPinned = true;
};

// Method to unpin message
messageSchema.methods.unpin = function(): void {
  this.isPinned = false;
};

// Method to forward message
messageSchema.methods.forward = function(): void {
  this.isForwarded = true;
};

// Virtual for reaction count
messageSchema.virtual('reactionCount').get(function() {
  return this.reactions.length;
});

// Virtual for seen count
messageSchema.virtual('seenCount').get(function() {
  return this.seenBy.length;
});

// Virtual for delivered count
messageSchema.virtual('deliveredCount').get(function() {
  return this.deliveredTo.length;
});

export default mongoose.model<IMessage>('Message', messageSchema); 