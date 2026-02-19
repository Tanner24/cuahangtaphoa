import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';

// Tạo hóa đơn mới (checkout)
export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const storeId = parseInt(req.user?.storeId || '0');
        const userId = parseInt(req.user?.userId || '0');
        const { items, paymentMethod, customerId, note, discount } = req.body;

        if (!items || items.length === 0) {
            res.status(400).json({ error: 'Giỏ hàng trống' });
            return;
        }

        // Tính tổng tiền
        let totalAmount = 0;
        const processedItems = items.map((item: any) => {
            const rowTotal = item.price * item.quantity;
            totalAmount += rowTotal;
            return {
                productId: parseInt(String(item.id)),
                quantity: item.quantity,
                price: item.price
            };
        });

        if (discount) {
            // Giảm giá (giả sử backend không xử logic phức tạp về mã)
            totalAmount -= discount;
            if (totalAmount < 0) totalAmount = 0;
        }

        // Generate mã đơn hàng (đơn giản, có thể dùng nanoid sau này)
        const orderCode = `INV-${Date.now().toString().slice(-6)}`;

        // Dùng transaction để đảm bảo dữ liệu nhất quán
        const order = await prisma.$transaction(async (tx) => {
            // 1. Tạo order và items
            const newOrder = await tx.invoice.create({
                data: {
                    storeId: storeId as any,
                    userId: userId as any,
                    code: orderCode,
                    customerId: customerId ? parseInt(String(customerId)) as any : null,
                    totalAmount: totalAmount as any,
                    paymentMethod: paymentMethod || 'CASH',
                    note,
                    items: {
                        create: processedItems
                    }
                } as any,
                include: { items: true } as any
            });

            // 2. Cập nhật tồn kho
            for (const item of processedItems) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { currentStock: { decrement: item.quantity } } as any
                });
            }

            // 3. Cập nhật công nợ nếu là GHI NỢ
            if (paymentMethod === 'DEBT' && customerId) {
                await tx.customer.update({
                    where: { id: parseInt(String(customerId)) as any },
                    data: { debtBalance: { increment: totalAmount as any } } as any
                });
            }

            return newOrder;
        });

        res.status(201).json({ data: order, message: 'Thanh toán thành công' });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// Lấy lịch sử đơn hàng (cho thu ngân xem lại)
export const getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const storeId = parseInt(req.user?.storeId as any || '0');
        // Allow manager to see all orders? For now, keep it simple: store-wide orders
        // const userId = parseInt(req.user?.userId || '0'); 

        const p = parseInt(String(req.query.page)) || 1;
        const l = parseInt(String(req.query.limit)) || 20;
        const search = req.query.search as string;

        const where: any = { storeId: storeId as any };
        if (search) {
            where.code = { contains: search };
        }

        const [orders, total] = await Promise.all([
            prisma.invoice.findMany({
                where,
                take: l, skip: (p - 1) * l,
                orderBy: { createdAt: 'desc' },
                include: {
                    items: { include: { product: true } }, // Include product details
                    customer: true
                } as any
            }),
            prisma.invoice.count({ where })
        ]);

        res.json({ data: orders, meta: { total, page: p, limit: l, totalPages: Math.ceil(total / l) } });
    } catch (error) {
        console.error('Get Orders Error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};
// Hủy đơn hàng (Delete Invoice)
export const deleteOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const storeId = parseInt(req.user?.storeId || '0');
        const orderId = parseInt(req.params.id);

        if (!orderId) {
            res.status(400).json({ error: 'Order ID required' });
            return;
        }

        const existingOrder = await prisma.invoice.findFirst({
            where: { id: orderId, storeId: storeId as any },
            include: { items: true } as any
        });

        if (!existingOrder) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        // TRANSACTION: Delete Invoice, Restore Stock, Restore Debt
        await prisma.$transaction(async (tx) => {
            // 1. Restore Stock
            if (existingOrder.items && existingOrder.items.length > 0) {
                const items = existingOrder.items as any[];
                for (const item of items) {
                    await tx.product.update({
                        where: { id: parseInt(item.productId) },
                        data: { currentStock: { increment: parseInt(item.quantity) } } as any
                    });
                }
            }

            // 2. Revert Debt (if applicable)
            if (existingOrder.paymentMethod === 'DEBT' && existingOrder.customerId) {
                await tx.customer.update({
                    where: { id: existingOrder.customerId as any },
                    data: { debtBalance: { decrement: existingOrder.totalAmount as any } } as any
                });
            }

            // 3. Delete Invoice
            await tx.invoice.delete({ where: { id: orderId } });
        });

        // AUDIT LOG
        await logAudit({
            storeId,
            userId: req.user?.userId ? parseInt(String(req.user.userId)) : 0,
            action: 'DELETE',
            entity: 'Invoice',
            entityId: String(orderId),
            oldData: existingOrder, // Snapshot of deleted order
            ipAddress: req.ip,
            device: req.headers['user-agent']
        });

        res.json({ success: true, message: 'Đã hủy đơn hàng và hoàn nhập kho' });

    } catch (error) {
        console.error('Delete Order Error:', error);
        res.status(500).json({ error: 'Lỗi khi hủy đơn hàng' });
    }
};
