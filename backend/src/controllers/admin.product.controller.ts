import { Request, Response } from 'express';
import prisma from '../config/database';
import * as XLSX from 'xlsx';

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { search, storeId, categoryId, page, limit } = req.query;

        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: 'insensitive' } },
                { barcode: { contains: String(search) } }
            ];
        }

        if (storeId) {
            where.storeId = parseInt(String(storeId));
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
                    store: {
                        select: { name: true }
                    },
                    categoryRel: {
                        select: { name: true }
                    }
                },
                take: l,
                skip: (p - 1) * l,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.product.count({ where })
        ]);

        res.json({
            data: products,
            meta: {
                total,
                page: p,
                limit: l,
                totalPages: Math.ceil(total / l)
            }
        });
    } catch (error) {
        console.error('Admin Get All Products error:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy danh sách sản phẩm' });
    }
};

export const deleteProductAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        await prisma.product.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Đã xóa sản phẩm thành công' });
    } catch (error) {
        console.error('Admin Delete Product error:', error);
        res.status(500).json({ error: 'Lỗi server khi xóa sản phẩm' });
    }
};

export const importProductsAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'Vui lòng tải lên tệp tin (Excel hoặc CSV)' });
            return;
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (data.length === 0) {
            res.status(400).json({ error: 'Tệp tin không có dữ liệu hoặc định dạng không đúng' });
            return;
        }

        let successCount = 0;
        let skipCount = 0;
        const errors: string[] = [];

        // Chạy tuần tự để tránh quá tải DB và dễ bắt lỗi (có thể tối ưu bằng batch insert nếu cần)
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const {
                name, barcode, price, priceIn,
                unit, storeId, categoryId,
                currentStock, minStock
            } = row;

            if (!name || !storeId) {
                errors.push(`Dòng ${i + 2}: Thiếu tên hoặc ID cửa hàng`);
                skipCount++;
                continue;
            }

            try {
                const sId = parseInt(String(storeId));

                // Kiểm tra barcode trùng lặp trong cùng 1 store
                if (barcode) {
                    const existing = await prisma.product.findFirst({
                        where: { storeId: sId, barcode: String(barcode) }
                    });
                    if (existing) {
                        errors.push(`Dòng ${i + 2}: Mã vạch ${barcode} đã tồn tại trong cửa hàng ${storeId}`);
                        skipCount++;
                        continue;
                    }
                }

                await prisma.product.create({
                    data: {
                        name: String(name),
                        barcode: barcode ? String(barcode) : null,
                        price: parseFloat(String(price || 0)),
                        priceIn: parseFloat(String(priceIn || 0)),
                        unit: String(unit || 'Cái'),
                        storeId: sId,
                        categoryId: categoryId ? parseInt(String(categoryId)) : null,
                        currentStock: parseInt(String(currentStock || 0)),
                        minStockThreshold: parseInt(String(minStock || 5)),
                    }
                });
                successCount++;
            } catch (err: any) {
                errors.push(`Dòng ${i + 2}: ${err.message}`);
                skipCount++;
            }
        }

        res.json({
            message: `Nhập dữ liệu hoàn tất. Thành công: ${successCount}, Bỏ qua: ${skipCount}`,
            successCount,
            skipCount,
            errors: errors.length > 5 ? [...errors.slice(0, 5), '...'] : errors
        });
    } catch (error) {
        console.error('Admin Import Products error:', error);
        res.status(500).json({ error: 'Lỗi server khi nhập dữ liệu sản phẩm' });
    }
};
