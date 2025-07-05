import { Request, Response } from 'express';
import multer from 'multer';
declare const upload: multer.Multer;
export declare const uploadImage: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const uploadVideo: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const uploadAudio: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const uploadFile: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const deleteFile: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const searchGifs: (req: Request, res: Response, next: import("express").NextFunction) => void;
export { upload };
//# sourceMappingURL=upload.controller.d.ts.map