import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Tìm kiếm khách hàng
export const searchCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const storeId = req.user?.storeId || 0;
        const { query } = req.query;

        if (!query || String(query).length < 2) {
            res.json({ data: [] });
            return;
        }

        const customers = await prisma.customer.findMany({
            where: {
                storeId: storeId as any,
                OR: [
                    { name: { contains: String(query) } },
                    { phone: { contains: String(query) } }
                ]
            },
            take: 10
        });

        res.json({ data: customers });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// Tạo nhanh khách hàng
export const createCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const storeId = req.user?.storeId || 0;
        const { name, phone, address } = req.body;

        if (!name) {
            res.status(400).json({ error: 'Tên khách hàng là bắt buộc' });
            return;
        }

        const existing = await prisma.customer.findFirst({
            where: { storeId: storeId as any, phone }
        });

        if (existing) {
            res.status(409).json({ error: 'Khách hàng này đã có trong hệ thống' });
            return;
        }

        const customer = await prisma.customer.create({
            data: {
                storeId: storeId as any,
                name,
                phone,
                address
            }
        });

        res.status(201).json({ data: customer, message: 'Đã thêm khách hàng mới' });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi server' });
    }
};
