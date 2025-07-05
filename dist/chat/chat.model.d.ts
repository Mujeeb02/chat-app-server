import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<IChat, {}, {}, {}, mongoose.Document<unknown, {}, IChat, {}> & IChat & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=chat.model.d.ts.map