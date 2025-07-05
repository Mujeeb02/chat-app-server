import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<IMessage, {}, {}, {}, mongoose.Document<unknown, {}, IMessage, {}> & IMessage & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=message.model.d.ts.map