import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getPlans = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const plans = await prisma.subscriptionPlan.findMany({
            orderBy: { price: 'asc' },
            include: { _count: { select: { stores: true } } },
        });
        // Parse JSON string back to object for frontend
        const parsedPlans = plans.map(p => ({
            ...p,
            features: p.features ? JSON.parse(p.features) : []
        }));
        res.json({ data: parsedPlans });
    } catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

export const createPlan = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, maxProducts, maxUsers, price, durationDays, features } = req.body;
        if (!name || price === undefined) {
            res.status(400).json({ error: 'Tên và giá gói là bắt buộc' });
            return;
        }
        const plan = await prisma.subscriptionPlan.create({
            data: {
                name,
                maxProducts: maxProducts || 50,
                maxUsers: maxUsers || 1,
                price,
                durationDays: durationDays || 30,
                features: features ? JSON.stringify(features) : null
            },
        });
        res.status(201).json({ data: plan, message: 'Tạo gói thành công' });
    } catch (error) {
        console.error('Create plan error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

export const updatePlan = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        const { name, maxProducts, maxUsers, price, durationDays, features } = req.body;
        const plan = await prisma.subscriptionPlan.update({
            where: { id },
            data: {
                name,
                maxProducts,
                maxUsers,
                price,
                durationDays,
                features: features ? JSON.stringify(features) : undefined
            },
        });
        res.json({ data: plan, message: 'Cập nhật gói thành công' });
    } catch (error) {
        console.error('Update plan error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

export const deletePlan = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);

        // Check if there are any stores using this plan
        const storeCount = await prisma.store.count({
            where: { subscriptionPlanId: id }
        });

        if (storeCount > 0) {
            res.status(400).json({ error: 'Không thể xóa gói đang có cửa hàng sử dụng' });
            return;
        }

        await prisma.subscriptionPlan.delete({
            where: { id }
        });

        res.json({ message: 'Xóa gói thành công' });
    } catch (error) {
        console.error('Delete plan error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};
