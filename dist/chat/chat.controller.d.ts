import { Request, Response } from 'express';
export declare const createChat: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getChats: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getChat: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateChat: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const deleteChat: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const addParticipant: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const removeParticipant: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const addAdmin: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const removeAdmin: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const toggleMute: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const togglePin: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const generateInviteLink: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const joinByInvite: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=chat.controller.d.ts.map