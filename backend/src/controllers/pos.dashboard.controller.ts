import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getPosDashboard = async (req: any, res: Response): Promise<void> => {
    try {
        const storeId = parseInt(req.user?.storeId || '0');
        const period = req.query.period as string || '7days';

        let startDate = new Date();
        let endDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        // Date Logic
        if (period === 'today') {
            // Default is today
        } else if (period === 'yesterday') {
            startDate.setDate(startDate.getDate() - 1);
            endDate.setDate(endDate.getDate() - 1);
        } else if (period === '7days') {
            startDate.setDate(startDate.getDate() - 6);
        } else if (period === 'thisMonth') {
            startDate.setDate(1);
        } else if (period === 'lastMonth') {
            startDate.setMonth(startDate.getMonth() - 1);
            startDate.setDate(1);
            endDate.setDate(0); // Last day of previous month
        }

        const whereDate = {
            storeId: storeId as any,
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        };

        // 1. Overview Stats
        const [totalOrders, revenueAgg] = await Promise.all([
            prisma.invoice.count({ where: whereDate }),
            prisma.invoice.aggregate({
                where: whereDate,
                _sum: { totalAmount: true }
            })
        ]);

        // 4. Debt Added (Assumed paymentMethod = 'DEBT')
        // Note: Real debt tracking should use Customer Debt Balance changes, but for now filtering invoices by payment method 'DEBT' is a proxy
        const debtAgg = await prisma.invoice.aggregate({
            where: { ...whereDate, paymentMethod: 'DEBT' },
            _sum: { totalAmount: true }
        });

        // 3. Low Stock (Realtime, not dependent on period)
        const lowStock = await prisma.product.count({
            where: { storeId: storeId as any, currentStock: { lte: 5 } } as any
        });

        // 2. Chart Logic
        // If period is today/yesterday -> show hourly? To keep simple, show Daily breakdown for the selected period
        // For 'today' or 'yesterday', it will show just one bar or we can split by hour. Let's stick to Daily for 7days/Month and maybe simple list for single day

        let chartData: any[] = [];
        const dayDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));

        if (dayDiff <= 1) {
            // For single day, maybe not much to chart unless hourly. Let's just return the single day revenue for consistency or previous 7 days trend?
            // User usually expects Trend Chart. Let's return the last 7 days trend regardless of filter, OR return breakdown of the period.
            // Let's return breakdown of the period by day.
            const d = new Date(startDate);
            const r = await prisma.invoice.aggregate({
                where: whereDate,
                _sum: { totalAmount: true }
            });
            chartData.push({
                date: `${d.getDate()}/${d.getMonth() + 1}`,
                revenue: Number(r._sum.totalAmount || 0)
            });
        } else {
            // Loop through each day in range
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const s = new Date(d); s.setHours(0, 0, 0, 0);
                const e = new Date(d); e.setHours(23, 59, 59, 999);

                const rev = await prisma.invoice.aggregate({
                    where: {
                        storeId: storeId as any,
                        createdAt: { gte: s, lte: e }
                    },
                    _sum: { totalAmount: true }
                });
                chartData.push({
                    date: `${d.getDate()}/${d.getMonth() + 1}`,
                    revenue: Number(rev._sum.totalAmount || 0)
                });
            }
        }

        // 5. Top Selling Products
        const topProducts = await prisma.invoiceItem.groupBy({
            by: ['productId'],
            where: {
                invoice: {
                    storeId: storeId as any,
                    createdAt: { gte: startDate, lte: endDate }
                }
            },
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5
        });

        // Hydrate product names
        const topProductsHydrated = await Promise.all(topProducts.map(async (item) => {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
                select: { name: true, unit: true }
            });
            return {
                name: product?.name || 'Sản phẩm đã xóa',
                quantity: item._sum?.quantity || 0,
                unit: product?.unit || ''
            };
        }));

        res.json({
            overview: {
                revenue: Number(revenueAgg._sum.totalAmount || 0),
                totalOrders,
                profit: Number(revenueAgg._sum.totalAmount || 0) * 0.3, // Mock profit 30%
                debtAdded: Number(debtAgg._sum.totalAmount || 0)
            },
            chart: chartData,
            topProducts: topProductsHydrated,
            lowStockCount: lowStock
        });

    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ error: 'Lỗi server lấy thống kê' });
    }
};
