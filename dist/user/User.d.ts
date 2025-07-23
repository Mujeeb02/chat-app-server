import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    username: string;
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    bio?: string;
    status: 'online' | 'offline' | 'away' | 'busy';
    lastSeen: Date;
    googleId?: string;
    githubId?: string;
    isEmailVerified: boolean;
    emailVerificationToken?: string;
    emailVerificationExpires?: Date;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    refreshToken?: string;
    refreshTokens: string[];
    settings: {
        notifications: {
            email: boolean;
            push: boolean;
            sound: boolean;
        };
        privacy: {
            showStatus: boolean;
            showLastSeen: boolean;
            allowMessages: boolean;
        };
        theme: 'light' | 'dark' | 'auto';
    };
    oauth?: {
        google?: {
            id: string;
            token: string;
            email: string;
        };
        github?: {
            id: string;
            token: string;
            email: string;
        };
    };
    comparePassword(candidatePassword: string): Promise<boolean>;
    getPublicProfile(): any;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}> & IUser & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=User.d.ts.map