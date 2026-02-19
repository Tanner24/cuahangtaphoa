import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from './auth';

export const auditLog = (action: string, entityType: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        const originalJson = res.json.bind(res);

        res.json = function (body: any) {
            if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
                prisma.systemLog.create({
                    data: {
                        userId: req.user?.userId ? parseInt(String(req.user.userId)) : undefined,
                        storeId: req.user?.storeId ? parseInt(String(req.user.storeId)) : undefined,
                        action: action,
                        entityType: entityType,
                        entityId: req.params.id ? String(req.params.id) : null,
                        ipAddress: req.ip || (req.socket.remoteAddress),
                        userAgent: req.headers['user-agent'] || null,
                        newData: req.body ? JSON.stringify(req.body) : undefined,
                    } as any, // Cast to any to bypass potential outdated Prisma Client types
                }).catch(err => console.error('Audit log failed:', err.message));
            }
            return originalJson(body);
        };

        next();
    };
};
