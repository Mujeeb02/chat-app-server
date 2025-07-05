import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    bio?: string;
    phoneNumber?: string;
    dateOfBirth?: Date;
    location?: string;
    website?: string;
    socialLinks?: {
        twitter?: string;
        linkedin?: string;
        github?: string;
    };
    status: 'online' | 'offline' | 'away' | 'busy';
    lastSeen: Date;
    isVerified: boolean;
    isAdmin: boolean;
    isOnline: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
    refreshTokens: string[];
    oauthProviders: {
        google?: {
            id: string;
            email: string;
        };
        github?: {
            id: string;
            email: string;
        };
    };
    preferences: {
        theme: 'light' | 'dark' | 'auto';
        language: string;
        notifications: {
            messages: boolean;
            calls: boolean;
            mentions: boolean;
            groupUpdates: boolean;
        };
        privacy: {
            showStatus: boolean;
            showLastSeen: boolean;
            allowReadReceipts: boolean;
        };
    };
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    generateAuthToken(): string;
    toJSON(): any;
}
declare const _default: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}> & IUser & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=user.model.d.ts.map