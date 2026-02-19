import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getDebtors = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const storeId = req.user?.storeId || 0;
        const { search } = req.query;

        // In absence of actual "Debt" table, we might aggregate from invoices (DEBT) or just use customer debt field (if exists)
        // Assume Customer has debt (we don't have debt field in Customer yet, let's assume we fetch Invoices with status DEBT)
        // For MVP, we fetch Invoices where paymentMethod='DEBT' and sum total. Or Customer table.
        // Let's check Schema... Customer table has name, phone, address. No Debt field.
        // Invoice table has paymentMethod 'DEBT'.

        // Complex query: Group by Customer (who has debt invoices).
        // Since we can't easily add schema now without migrate, let's Aggregate Invoices.

        const lowStock = await prisma.product.count({
            where: { storeId: storeId as any, currentStock: { lte: 5 } } as any
        });
        const debtors = await prisma.invoice.groupBy({
            by: ['customerId'],
            where: {
                storeId: storeId as any,
                paymentMethod: 'DEBT',
                customerId: { not: null }
            },
            _sum: {
                totalAmount: true
            },
            having: {
                totalAmount: { _sum: { gt: 0 } }
            }
        });

        // Now fetch customer details for these IDs
        const result = [];
        for (const d of debtors) {
            if (!d.customerId) continue;
            const customer = await prisma.customer.findUnique({
                where: { id: d.customerId }
            });
            if (customer && (!search || customer.name.includes(String(search)) || (customer.phone || '').includes(String(search)))) {
                result.push({
                    id: customer.id,
                    name: customer.name,
                    phone: customer.phone || '',
                    debtTotal: d._sum.totalAmount || 0,
                    lastDebtDate: new Date() // Mock
                });
            }
        }

        res.json(result);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi server' });
    }
}
