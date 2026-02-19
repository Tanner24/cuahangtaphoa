import { Request, Response } from 'express';
import prisma from '../config/database';

// Get all categories
export const getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
        const storeId = parseInt(req.user?.storeId as any || '0');
        const categories = await prisma.category.findMany({
            where: { storeId },
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { products: true } } }
        });
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Lỗi lấy danh sách danh mục' });
    }
};

// Create category
export const createCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const storeId = parseInt(req.user?.storeId as any || '0');
        const { name, description } = req.body;

        if (!name) {
            res.status(400).json({ error: 'Tên danh mục là bắt buộc' });
            return;
        }

        const existing = await prisma.category.findFirst({
            where: { storeId, name }
        });

        if (existing) {
            res.status(400).json({ error: 'Danh mục này đã tồn tại' });
            return;
        }

        const category = await prisma.category.create({
            data: {
                storeId,
                name,
                description
            }
        });

        res.status(201).json(category);
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Lỗi tạo danh mục' });
    }
};

// Update category
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const storeId = parseInt(req.user?.storeId as any || '0');
        const { id } = req.params;
        const { name, description } = req.body;

        const category = await prisma.category.findFirst({
            where: { id: parseInt(id), storeId }
        });

        if (!category) {
            res.status(404).json({ error: 'Không tìm thấy danh mục' });
            return;
        }

        const updated = await prisma.category.update({
            where: { id: parseInt(id) },
            data: { name, description }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi cập nhật danh mục' });
    }
};

// Delete category
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const storeId = parseInt(req.user?.storeId as any || '0');
        const { id } = req.params;

        const category = await prisma.category.findFirst({
            where: { id: parseInt(id), storeId }
        });

        if (!category) {
            res.status(404).json({ error: 'Không tìm thấy danh mục' });
            return;
        }

        await prisma.category.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Đã xóa danh mục' });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi xóa danh mục' });
    }
};
