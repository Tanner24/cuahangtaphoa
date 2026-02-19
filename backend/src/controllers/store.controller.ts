import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcrypt';

export const getStores = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as string;
        const search = req.query.search as string;

        const where: any = {};
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { ownerName: { contains: search } },
                { phone: { contains: search } },
            ];
        }

        const [stores, total] = await Promise.all([
            prisma.store.findMany({
                where,
                include: {
                    subscriptionPlan: true,
                    _count: { select: { users: true, products: true, invoices: true } },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.store.count({ where }),
        ]);

        res.json({
            data: stores,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Get stores error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

export const createStore = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, ownerName, phone, email } = req.body;
        if (!name || !phone) {
            res.status(400).json({ error: 'Tên cửa hàng và SĐT là bắt buộc' });
            return;
        }

        const existing = await prisma.store.findUnique({ where: { phone } });
        if (existing) {
            res.status(409).json({ error: 'SĐT đã được đăng ký' });
            return;
        }

        let plan = await prisma.subscriptionPlan.findFirst({ where: { name: 'Free' } });

        const store = await prisma.store.create({
            data: {
                name,
                ownerName,
                phone,
                email,
                subscriptionPlanId: plan?.id,
                subscriptionExpiredAt: plan
                    ? new Date(Date.now() + plan.durationDays * 86400000)
                    : null,
            },
            include: { subscriptionPlan: true },
        });

        if (plan) {
            await prisma.storeSubscription.create({
                data: {
                    storeId: store.id,
                    planId: plan.id,
                    endDate: new Date(Date.now() + plan.durationDays * 86400000),
                },
            });
        }

        res.status(201).json({ data: store, message: 'Tạo cửa hàng thành công' });
    } catch (error) {
        console.error('Create store error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

export const updateStore = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        const { name, ownerName, phone, email } = req.body;
        const store = await prisma.store.update({
            where: { id },
            data: { name, ownerName, phone, email },
            include: { subscriptionPlan: true },
        });
        res.json({ data: store, message: 'Cập nhật thành công' });
    } catch (error) {
        console.error('Update store error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

export const suspendStore = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        const store = await prisma.store.update({
            where: { id },
            data: { status: 'suspended' },
        });
        res.json({ data: store, message: `"${store.name}" đã bị tạm ngưng` });
    } catch (error) {
        console.error('Suspend store error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

export const activateStore = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        const store = await prisma.store.update({
            where: { id },
            data: { status: 'active' },
        });
        res.json({ data: store, message: `"${store.name}" đã kích hoạt lại` });
    } catch (error) {
        console.error('Activate store error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

export const getStoreDetail = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        const store = await prisma.store.findUnique({
            where: { id },
            include: {
                subscriptionPlan: true,
                storeSubscriptions: { orderBy: { createdAt: 'desc' }, take: 10, include: { plan: true } },
                payments: { orderBy: { createdAt: 'desc' }, take: 10 },
                _count: { select: { users: true, products: true, invoices: true, customers: true } },
            },
        });
        if (!store) { res.status(404).json({ error: 'Không tìm thấy cửa hàng' }); return; }
        res.json({ data: store });
    } catch (error) {
        console.error('Get store detail error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

export const subscribeStore = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        const { planId, paymentMethod } = req.body;
        const plan = await prisma.subscriptionPlan.findUnique({ where: { id: parseInt(planId) } });
        if (!plan) { res.status(404).json({ error: 'Không tìm thấy gói' }); return; }

        const endDate = new Date(Date.now() + plan.durationDays * 86400000);
        await prisma.store.update({
            where: { id },
            data: { subscriptionPlanId: plan.id, subscriptionExpiredAt: endDate, status: 'active' },
        });
        const subscription = await prisma.storeSubscription.create({
            data: { storeId: id, planId: plan.id, endDate },
            include: { plan: true },
        });
        await prisma.payment.create({
            data: { storeId: id, amount: plan.price, method: paymentMethod || 'cash', status: 'completed', paidAt: new Date() },
        });
        res.json({ data: subscription, message: 'Đăng ký gói thành công' });
    } catch (error) {
        console.error('Subscribe store error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

export const extendStore = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        const { days } = req.body;
        if (!days || days <= 0) { res.status(400).json({ error: 'Số ngày phải > 0' }); return; }

        const store = await prisma.store.findUnique({ where: { id } });
        if (!store) { res.status(404).json({ error: 'Không tìm thấy cửa hàng' }); return; }

        const baseDate = store.subscriptionExpiredAt && store.subscriptionExpiredAt > new Date()
            ? store.subscriptionExpiredAt : new Date();
        const newEndDate = new Date(baseDate.getTime() + days * 86400000);

        await prisma.store.update({
            where: { id },
            data: { subscriptionExpiredAt: newEndDate, status: 'active' },
        });

        res.json({ data: { newExpiredAt: newEndDate }, message: `Gia hạn ${days} ngày cho "${store.name}"` });
    } catch (error) {
        console.error('Extend store error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

export const resetStorePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
            return;
        }

        const store = await prisma.store.findUnique({ where: { id } });
        if (!store) {
            res.status(404).json({ error: 'Không tìm thấy cửa hàng' });
            return;
        }

        // Tìm user là chủ cửa hàng (role owner)
        // Trong hệ thống này, username của owner trùng với SĐT cửa hàng
        const owner = await prisma.user.findFirst({
            where: {
                storeId: id,
                username: store.phone
            }
        });

        if (!owner) {
            res.status(404).json({ error: 'Không tìm thấy tài khoản chủ cửa hàng' });
            return;
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: owner.id },
            data: { passwordHash }
        });

        res.json({ message: `Đã reset mật khẩu cho cửa hàng "${store.name}"` });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};
