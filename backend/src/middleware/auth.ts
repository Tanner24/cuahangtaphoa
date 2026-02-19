import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthPayload {
    userId: string;   // JWT stores as string
    storeId: string;  // JWT stores as string
    role: string;
}

export interface AuthRequest extends Request {
    user?: AuthPayload;
}

/**
 * Middleware xác thực JWT token
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Không có token xác thực' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token không hợp lệ hoặc hết hạn' });
        return;
    }
};

/**
 * Middleware phân quyền RBAC
 */
export const authorize = (...allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Chưa xác thực' });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({ error: 'Không có quyền truy cập' });
            return;
        }

        next();
    };
};
