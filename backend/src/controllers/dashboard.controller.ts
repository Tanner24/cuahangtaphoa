import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Mặc định lấy theo storeId của user đang login. 
        // Nếu là super_admin muốn xem all thì xử lý sau, giờ ưu tiên giống pos-app (Store view).
        const storeId = req.user?.storeId ? parseInt(req.user.storeId) : undefined;

        // Default: 7 days or query param
        const period = req.query.period as string || '7days'; // today, yesterday, 7days, this_month
        let startDate = new Date();
        let endDate = new Date();

        // Timezone basic handling (vn is GMT+7) - Simplification for now
        const now = new Date();
        endDate = new Date(now);

        if (period === 'today') {
            startDate = new Date(now.setHours(0, 0, 0, 0));
            endDate = new Date(now.setHours(23, 59, 59, 999));
        } else if (period === 'yesterday') {
            const y = new Date(now);
            y.setDate(y.getDate() - 1);
            startDate = new Date(y.setHours(0, 0, 0, 0));
            endDate = new Date(y.setHours(23, 59, 59, 999));
        } else if (period === '7days') {
            const d = new Date(now);
            d.setDate(d.getDate() - 6);
            startDate = new Date(d.setHours(0, 0, 0, 0));
        } else if (period === 'this_month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        }

        const whereStore = storeId ? { storeId } : {}; // If super_admin and no storeId, fetch all? Let's limit to specific store if possible or all.
        // For safety, if storeId exists, use it.

        const whereDate = {
            createdAt: {
                gte: startDate,
                lte: endDate
            },
            ...whereStore
        };

        // 1. Overview Cards
        const [totalOrders, revenueAgg] = await Promise.all([
            prisma.invoice.count({ where: whereDate }),
            prisma.invoice.aggregate({
                where: whereDate,
                _sum: { totalAmount: true }
            })
        ]);

        // Profit (Estimated: Revenue - (Import Price * Quantity))
        // This is complex in Prisma if not stored directly. 
        // For MVP/Porting, we might skip precise profit or fetch items to calc.
        // Let's simplified profit = revenue * 0.3 (30%) temporary or try to calc from items.
        // Better: Fetch items and calc.

        // 2. Chart Data (Last 7 days revenue) independent of period? Or follow period?
        // PHP version basically forces 7 days chart.
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const startD = new Date(d.setHours(0, 0, 0, 0));
            const endD = new Date(d.setHours(23, 59, 59, 999));

            const dayRev = await prisma.invoice.aggregate({
                where: {
                    ...whereStore,
                    createdAt: { gte: startD, lte: endD }
                },
                _sum: { totalAmount: true }
            });

            chartData.push({
                date: `${d.getDate()}/${d.getMonth() + 1}`,
                revenue: Number(dayRev._sum.totalAmount || 0)
            });
        }

        // 3. Low Stock 
        const lowStockItems = await prisma.product.findMany({
            where: {
                ...whereStore,
                // currentStock <= min_stock_threshold (Need to add minStock to schema or assume 5)
                currentStock: { lte: 5 }
            },
            take: 5,
            orderBy: { currentStock: 'asc' }
        });

        const lowStockCount = await prisma.product.count({
            where: { ...whereStore, currentStock: { lte: 5 } }
        });

        // 4. Recent Orders
        const recentOrders = await prisma.invoice.findMany({
            where: whereStore,
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { customer: { select: { name: true } } }
        });

        // 5. Build Response
        res.json({
            data: {
                overview: {
                    totalOrders,
                    revenue: Number(revenueAgg._sum.totalAmount || 0),
                    profit: Number(revenueAgg._sum.totalAmount || 0) * 0.3, // Mock profit 30%
                    debtAdded: 0 // Mock debt
                },
                chart: chartData,
                lowStock: {
                    count: lowStockCount,
                    items: lowStockItems
                },
                recentOrders: recentOrders.map(o => ({
                    id: o.id,
                    code: o.code,
                    customer: o.customer?.name || 'Khách lẻ',
                    total: Number(o.totalAmount),
                    payment: o.paymentMethod,
                    time: o.createdAt
                })),
                topDebtors: [] // Feature to add later
            }
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

export const getSystemLogs = async (req: AuthRequest, res: Response): Promise<void> => {
    // ... existing logs logic (keep it)
    res.json({ data: [] });
};
