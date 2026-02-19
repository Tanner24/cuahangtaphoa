import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Lấy danh sách phiếu trả hàng
export const getRefunds = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const storeId = parseInt(req.user?.storeId as any || '0');
        const refunds = await prisma.returnRequest.findMany({
            where: { storeId },
            include: {
                invoice: { select: { code: true, customer: { select: { name: true } } } } as any,
                items: { include: { product: { select: { name: true, barcode: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(refunds);
    } catch (error) {
        console.error('Get Refunds Error:', error);
        res.status(500).json({ error: 'Lỗi lấy danh sách trả hàng' });
    }
};

// Tạo phiếu trả hàng
export const createRefund = async (req: AuthRequest, res: Response): Promise<void> => {
    const storeId = parseInt(req.user?.storeId as any || '0');
    const { invoiceId, items, reason, refundMethod } = req.body; // refundMethod: 'CASH', 'DEBT_DEDUCT'

    if (!items || items.length === 0) {
        res.status(400).json({ error: 'Chưa chọn sản phẩm trả lại' });
        return;
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get Invoice to check
            const invoice = await tx.invoice.findUnique({
                where: { id: parseInt(invoiceId) },
                include: { items: true, customer: true }
            });

            if (!invoice || invoice.storeId !== storeId) {
                throw new Error('Đơn hàng không tồn tại');
            }

            // 2. Calculate Total Refund & Validate Quantity
            let totalRefund = 0;
            const returnItemsData: any[] = []; // Explicitly type as any array (or correct interface)

            const invoiceItems = await tx.invoiceItem.findMany({
                where: { invoiceId: invoice.id }
            });

            for (const item of items) {
                const invItem = invoiceItems.find(ii => ii.productId === parseInt(item.productId));

                if (!invItem) {
                    throw new Error(`Sản phẩm ID ${item.productId} không có trong đơn hàng ${(invoice as any).code}`);
                }

                if (item.quantity > invItem.quantity) {
                    throw new Error(`Số lượng trả (${item.quantity}) vượt quá số lượng mua (${invItem.quantity}) của sản phẩm ID ${item.productId}`);
                }

                // Calculate refund price based on purchase price
                const refundPrice = Number(invItem.price);
                totalRefund += refundPrice * item.quantity;

                returnItemsData.push({
                    productId: parseInt(item.productId),
                    quantity: parseInt(item.quantity),
                    refundPrice: refundPrice
                });

                // 3. Update Inventory (Return to stock)
                await tx.product.update({
                    where: { id: parseInt(item.productId) },
                    data: { currentStock: { increment: parseInt(item.quantity) } } as any
                });
            }

            // 4. Create Return Request
            const returnCode = `RT${Date.now().toString().slice(-6)}`;

            // Create Request First
            const refund = await tx.returnRequest.create({
                data: {
                    storeId,
                    invoiceId: invoice.id,
                    returnCode,
                    totalAmount: totalRefund as any,
                    reason: reason || '',
                    status: 'completed',
                    items: {
                        createMany: {
                            data: returnItemsData
                        }
                    }
                } as any,
                include: { items: true } as any
            });

            // 5. Handle Money (Update Customer Debt or just Log)
            if (refundMethod === 'DEBT_DEDUCT' && invoice.customerId) {
                await tx.customer.update({
                    where: { id: invoice.customerId },
                    data: { debtBalance: { decrement: totalRefund as any } } as any
                });
            }

            return refund; // Return from transaction
        });

        res.status(201).json(result);

    } catch (error: any) {
        console.error('Create Refund Error:', error.message);
        res.status(400).json({ error: error.message || 'Lỗi tạo phiếu trả hàng' });
    }
};
