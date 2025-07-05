import { Request } from 'express';
import { Socket } from 'socket.io';
export interface IUser {
    _id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
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
    createdAt: Date;
    updatedAt: Date;
}
export interface IUserDocument extends IUser {
    comparePassword(candidatePassword: string): Promise<boolean>;
    getPublicProfile(): Partial<IUser>;
}
export interface IChat {
    _id: string;
    name: string;
    description?: string;
    type: 'direct' | 'group';
    participants: string[];
    admins: string[];
    avatar?: string;
    lastMessage?: {
        content: string;
        senderId: string;
        timestamp: Date;
    };
    unreadCount: Map<string, number>;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface IChatDocument extends IChat {
    addParticipant(userId: string): void;
    removeParticipant(userId: string): void;
    addAdmin(userId: string): void;
    removeAdmin(userId: string): void;
    updateUnreadCount(userId: string, count: number): void;
}
export interface IMessage {
    _id: string;
    chatId: string;
    senderId: string;
    content: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'gif';
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    reactions: Map<string, string>;
    isEdited: boolean;
    editedAt?: Date;
    isDeleted: boolean;
    deletedAt?: Date;
    replyTo?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IMessageDocument extends IMessage {
    addReaction(userId: string, reaction: string): void;
    removeReaction(userId: string): void;
    getReactionsCount(): {
        [reaction: string]: number;
    };
}
export interface IAuthRequest extends Request {
    user?: any;
}
export interface ILoginRequest {
    email: string;
    password: string;
}
export interface IRegisterRequest {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}
export interface IAuthResponse {
    user: Partial<IUser>;
    accessToken: string;
    refreshToken: string;
}
export interface ISocket extends Socket {
    userId?: string;
    user?: IUser;
}
export interface IApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface IFileUpload {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
}
export interface INotification {
    _id: string;
    recipientId: string;
    senderId: string;
    type: 'message' | 'mention' | 'reaction' | 'group_invite' | 'friend_request';
    title: string;
    message: string;
    data?: any;
    isRead: boolean;
    createdAt: Date;
}
export interface ICall {
    _id: string;
    callerId: string;
    receiverId: string;
    chatId: string;
    type: 'audio' | 'video';
    status: 'pending' | 'accepted' | 'rejected' | 'ended' | 'missed';
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    createdAt: Date;
}
export interface IEnvConfig {
    PORT: number;
    NODE_ENV: string;
    MONGODB_URI: string;
    REDIS_URL: string;
    REDIS_TOKEN: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    JWT_REFRESH_SECRET: string;
    JWT_REFRESH_EXPIRES_IN: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
    GIPHY_API_KEY: string;
    SMTP_HOST: string;
    SMTP_PORT: number;
    SMTP_USER: string;
    SMTP_PASS: string;
    STUN_SERVERS: string;
    TURN_SERVER: string;
    TURN_USERNAME: string;
    TURN_CREDENTIAL: string;
    CORS_ORIGIN: string;
    RATE_LIMIT_WINDOW_MS: number;
    RATE_LIMIT_MAX_REQUESTS: number;
    MAX_FILE_SIZE: number;
    ALLOWED_FILE_TYPES: string;
    NEXT_PUBLIC_API_URL: string;
    NEXT_PUBLIC_SOCKET_URL: string;
    NEXT_PUBLIC_APP_NAME: string;
}
export interface IEmailTemplate {
    subject: string;
    html: string;
    text: string;
}
export interface IUploadResult {
    url: string;
    publicId: string;
    format: string;
    size: number;
}
export interface IGiphyResult {
    id: string;
    url: string;
    title: string;
    width: number;
    height: number;
}
export interface IPaginationOptions {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface IPaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}
//# sourceMappingURL=index.d.ts.map