import { Request, Response } from 'express';
import prisma from '../config/database';

// Get brands
export const getBrands = async (req: Request, res: Response): Promise<void> => {
    try {
        const storeId = parseInt(req.user?.storeId as any || '0');
        const brands = await prisma.brand.findMany({
            where: { storeId },
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { products: true } } }
        });
        res.json(brands);
    } catch (error) {
        console.error('Get brands error:', error);
        res.status(500).json({ error: 'Lỗi lấy thương hiệu' });
    }
};

// Create brand
export const createBrand = async (req: Request, res: Response): Promise<void> => {
    try {
        const storeId = parseInt(req.user?.storeId as any || '0');
        const { name } = req.body;

        if (!name) {
            res.status(400).json({ error: 'Tên thương hiệu là bắt buộc' });
            return;
        }

        const brand = await prisma.brand.create({
            data: {
                storeId,
                name
            }
        });

        res.status(201).json(brand);
    } catch (error) {
        console.error('Create brand error:', error);
        res.status(500).json({ error: 'Lỗi tạo thương hiệu' });
    }
};
