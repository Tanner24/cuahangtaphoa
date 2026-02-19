
import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getSystemLogs = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const storeId = parseInt(req.user?.storeId || '0');
        const { page, limit, startDate, endDate, action } = req.query;

        const p = parseInt(String(page)) || 1;
        const l = parseInt(String(limit)) || 20;

        const where: any = { storeId: storeId as any };

        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(String(startDate)),
                lte: new Date(String(endDate))
            };
        }

        if (action) {
            where.action = String(action);
        }

        const [logs, total] = await Promise.all([
            (prisma as any).appLog.findMany({
                where,
                take: l,
                skip: (p - 1) * l,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { fullName: true, username: true }
                    }
                }
            }),
            (prisma as any).appLog.count({ where })
        ]);

        res.json({
            data: logs,
            meta: { total, page: p, limit: l, totalPages: Math.ceil(total / l) }
        });

    } catch (error) {
        console.error('Get Logs Error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};
