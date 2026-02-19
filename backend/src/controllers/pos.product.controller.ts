import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';
import { OFFService } from '../services/off.service';

export const getProducts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const storeIdStr = String(req.user?.storeId || '0');
        const storeId = parseInt(storeIdStr);
        const { search, categoryId, page, limit } = req.query;

        const where: any = { storeId: storeId as any };

        if (search) {
            where.OR = [
                { name: { contains: String(search) } },
                { barcode: { contains: String(search) } }
            ];
        }

        if (categoryId) {
            where.categoryId = parseInt(String(categoryId));
        }

        const p = parseInt(String(page)) || 1;
        const l = parseInt(String(limit)) || 50;

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    categoryRel: true,
                    brand: true
                },
                take: l,
                skip: (p - 1) * l,
                orderBy: { name: 'asc' }
            }),
            prisma.product.count({ where })
        ]);

        res.json({
            data: products,
            meta: { total, page: p, limit: l, totalPages: Math.ceil(total / l) }
        });
    } catch (error) {
        console.error('Get POS products error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

export const getProductByBarcode = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const storeIdStr = String(req.user?.storeId || '0');
        const storeId = parseInt(storeIdStr);
        const { barcode } = req.params;

        const product = await prisma.product.findFirst({
            where: { storeId: storeId as any, barcode },
            include: { categoryRel: true, brand: true }
        });

        if (!product) {
            res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
            return;
        }

        res.json({ data: product });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi server' });
    }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const storeIdStr = String(req.user?.storeId || '0');
        const storeId = parseInt(storeIdStr);
        const { name, barcode, price, priceIn, currentStock, minStockThreshold, category, categoryId, brandId, unit, imageUrl } = req.body;

        // Check duplicate barcode
        if (barcode) {
            const existing = await prisma.product.findFirst({ where: { storeId: storeId as any, barcode } });
            if (existing) {
                res.status(400).json({ error: 'Mã vạch đã tồn tại' });
                return;
            }
        }

        const product = await prisma.product.create({
            data: {
                storeId: storeId as any,
                name,
                barcode: barcode || null,
                price: parseFloat(price) || 0,
                priceIn: parseFloat(priceIn) || 0,
                currentStock: parseInt(currentStock) || 0,
                minStockThreshold: parseInt(minStockThreshold) || 5,
                category: category || 'Chung',
                categoryId: categoryId ? parseInt(categoryId) : null,
                brandId: brandId ? parseInt(brandId) : null,
                unit: unit || 'Cái',
                imageUrl
            }
        });

        res.status(201).json(product);
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const storeIdStr = String(req.user?.storeId || '0');
        const storeId = parseInt(storeIdStr);
        const { id } = req.params;
        const { name, barcode, price, priceIn, currentStock, minStockThreshold, category, categoryId, brandId, unit, imageUrl } = req.body;

        // Validation ownership
        const existing = await prisma.product.findFirst({ where: { id: parseInt(id), storeId: storeId as any } });
        if (!existing) {
            res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
            return;
        }

        const product = await prisma.product.update({
            where: { id: parseInt(id) },
            data: {
                name,
                barcode,
                price: parseFloat(price),
                priceIn: parseFloat(priceIn),
                currentStock: parseInt(currentStock),
                minStockThreshold: parseInt(minStockThreshold),
                category,
                categoryId: categoryId ? parseInt(categoryId) : null,
                brandId: brandId ? parseInt(brandId) : null,
                unit: unit || 'Cái',
                imageUrl
            }
        });

        // AUDIT LOG
        await logAudit({
            storeId,
            userId: req.user?.userId ? parseInt(String(req.user.userId)) : 0,
            action: 'UPDATE',
            entity: 'Product',
            entityId: id,
            oldData: existing,
            newData: product,
            ipAddress: req.ip,
            device: req.headers['user-agent']
        });

        res.json(product);
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

export const lookupBarcodeByOFF = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { barcode } = req.params;
        if (!barcode) {
            res.status(400).json({ error: 'Mã vạch không hợp lệ' });
            return;
        }

        const product = await OFFService.getProductByBarcode(barcode);

        if (!product) {
            res.status(404).json({ error: 'Không tìm thấy thông tin trên hệ thống quốc tế' });
            return;
        }

        res.json({ data: product });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi server' });
    }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const storeIdStr = String(req.user?.storeId || '0');
        const storeId = parseInt(storeIdStr);
        const { id } = req.params;

        const existing = await prisma.product.findFirst({ where: { id: parseInt(id), storeId: storeId as any } });
        if (!existing) {
            res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
            return;
        }

        await prisma.product.delete({ where: { id: parseInt(id) } });

        // AUDIT LOG
        await logAudit({
            storeId,
            userId: req.user?.userId ? parseInt(String(req.user.userId)) : 0,
            action: 'DELETE',
            entity: 'Product',
            entityId: id,
            oldData: existing,
            ipAddress: req.ip,
            device: req.headers['user-agent']
        });

        res.json({ message: 'Đã xóa sản phẩm' });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi server (có thể do ràng buộc dữ liệu)' });
    }
};
