import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getStoreInfo = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const storeId = parseInt(req.user?.storeId || '0');
        if (!storeId) {
            res.status(400).json({ error: 'Store ID không hợp lệ' });
            return;
        }

        console.log('Fetching store info for storeId:', storeId);
        const store = await prisma.store.findUnique({
            where: { id: storeId as any },
            include: {
                subscriptionPlan: true,
                _count: {
                    select: {
                        products: true,
                        invoices: true,
                        users: true,
                    }
                }
            }
        });

        if (!store) {
            console.log('Store not found for id:', storeId);
            res.status(404).json({ error: 'Không tìm thấy cửa hàng' });
            return;
        }

        // Parse features JSON if it exists
        if (store.subscriptionPlan && store.subscriptionPlan.features) {
            try {
                (store.subscriptionPlan as any).features = JSON.parse(store.subscriptionPlan.features);
            } catch (e) {
                (store.subscriptionPlan as any).features = [];
            }
        }

        // Map it to include usage for easy frontend consumption
        const result = {
            ...store,
            usage: {
                products: (store as any)._count.products,
                invoices: (store as any)._count.invoices,
                users: (store as any)._count.users,
            }
        };

        res.json(result);
    } catch (error) {
        console.error('Get Store Info Error:', error);
        res.status(500).json({
            error: 'Lỗi server khi lấy thông tin cửa hàng',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};

export const updateStoreInfo = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const storeId = parseInt(req.user?.storeId || '0');
        console.log('Updating store info for storeId:', storeId);

        if (!storeId) {
            res.status(400).json({ error: 'Store ID không hợp lệ' });
            return;
        }

        const { name, address, phone, bankName, bankAccountName, bankAccountNumber } = req.body;

        // Check if store exists first
        const existing = await prisma.store.findUnique({ where: { id: storeId as any } });
        if (!existing) {
            res.status(404).json({ error: 'Không tìm thấy cửa hàng để cập nhật' });
            return;
        }

        const store = await prisma.store.update({
            where: { id: storeId as any },
            data: {
                name: name || (existing as any).name,
                address: address !== undefined ? address : (existing as any).address,
                phone: phone !== undefined ? phone : (existing as any).phone,
                bankName: bankName !== undefined ? bankName : (existing as any).bankName,
                bankAccountName: bankAccountName !== undefined ? bankAccountName : (existing as any).bankAccountName,
                bankAccountNumber: bankAccountNumber !== undefined ? bankAccountNumber : (existing as any).bankAccountNumber
            } as any
        });

        res.json(store);
    } catch (error) {
        console.error('Update Store Info Error:', error);
        res.status(500).json({
            error: 'Lỗi server khi cập nhật cửa hàng',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};
