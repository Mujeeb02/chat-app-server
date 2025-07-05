import { Request, Response, NextFunction } from 'express';
import { IAuthRequest } from '../types';
export declare const authenticateToken: (req: IAuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const authenticateRefreshToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuth: (req: IAuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireAdmin: (req: IAuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map