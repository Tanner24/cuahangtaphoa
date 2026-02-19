import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as string;
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;

        const where: any = {};
        if (status) where.status = status;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                include: { store: { select: { id: true, name: true, ownerName: true } } },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.payment.count({ where }),
        ]);

        res.json({
            data: payments,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

export const getStorePayments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        const payments = await prisma.payment.findMany({
            where: { storeId: id },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ data: payments });
    } catch (error) {
        console.error('Get store payments error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};
