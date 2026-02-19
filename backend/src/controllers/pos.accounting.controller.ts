import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const createAccountingEntry = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const storeId = parseInt(req.user?.storeId || '0');
        const { type, data } = req.body; // type: 'import', 'expense', 'tax', 'salary'

        if (!storeId) {
            res.status(400).json({ error: 'Store ID required' });
            return;
        }

        let result;

        switch (type) {
            case 'import': // S2
                // data: { code, supplier, importDate, items: [{ productId, quantity, importPrice }] }
                const totalAmount = data.items.reduce((sum: number, item: any) => sum + (item.quantity * item.importPrice), 0);

                result = await (prisma as any).importReceipt.create({
                    data: {
                        storeId,
                        code: data.code,
                        supplier: data.supplier,
                        importDate: new Date(data.date),
                        totalAmount,
                        note: data.note,
                        items: {
                            create: data.items.map((item: any) => ({
                                productId: parseInt(item.productId),
                                quantity: parseInt(item.quantity),
                                importPrice: parseFloat(item.importPrice)
                            }))
                        }
                    }
                });

                // Update Product Stock (Simple logic)
                for (const item of data.items) {
                    await prisma.product.update({
                        where: { id: parseInt(item.productId) },
                        data: {
                            currentStock: { increment: parseInt(item.quantity) },
                            priceIn: parseFloat(item.importPrice) // Update latest import price
                        }
                    });
                }
                break;

            case 'expense': // S3 (Phiếu chi)
                result = await (prisma as any).expense.create({
                    data: {
                        storeId,
                        date: new Date(data.date),
                        amount: parseFloat(data.amount),
                        category: data.category, // electricity, water, rent...
                        description: data.description,
                        paymentMethod: data.paymentMethod || 'CASH',
                        invoiceCode: data.invoiceCode
                    }
                });
                break;

            case 'tax': // S4 (Nộp thuế)
                result = await (prisma as any).taxPayment.create({
                    data: {
                        storeId,
                        date: new Date(data.date),
                        amount: parseFloat(data.amount),
                        taxType: data.taxType, // vat, pit, license
                        description: data.description,
                        paymentMethod: data.paymentMethod || 'TRANSFER',
                        receiptCode: data.receiptCode
                    }
                });
                break;

            case 'salary': // S5 (Lương)
                result = await (prisma as any).salaryPayment.create({
                    data: {
                        storeId,
                        month: parseInt(data.month),
                        year: parseInt(data.year),
                        employeeName: data.employeeName,
                        baseSalary: parseFloat(data.baseSalary),
                        bonus: parseFloat(data.bonus || 0),
                        deduction: parseFloat(data.deduction || 0),
                        totalAmount: parseFloat(data.baseSalary) + parseFloat(data.bonus || 0) - parseFloat(data.deduction || 0),
                        paymentDate: new Date(data.paymentDate || new Date())
                    }
                });
                break;

            default:
                res.status(400).json({ error: 'Invalid entry type' });
                return;
        }

        res.json({ success: true, daa: result });

    } catch (error) {
        console.error('Create Accounting Entry Error:', error);
        res.status(500).json({ error: 'Failed to create entry' });
    }
};
