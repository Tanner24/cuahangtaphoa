import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import viettelInvoiceService from '../services/viettelInvoice.service';

export const signReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const reportData = req.body;

        // Connect and sign with Viettel HSM
        const signResult = await viettelInvoiceService.signReport(reportData);

        res.json(signResult);
    } catch (error: any) {
        console.error('Sign Report Error:', error);
        res.status(500).json({ error: 'Lỗi ký số báo cáo', message: error.message });
    }
};

export const getReportData = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const storeId = parseInt(req.user?.storeId || '0');
        const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
        const year = parseInt(req.query.year as string) || new Date().getFullYear();
        const type = req.query.type as string || 'tax'; // tax | accounting
        const book = req.query.book as string || 's1';

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const whereDate = {
            storeId: storeId as any,
            createdAt: { gte: startDate, lte: endDate }
        };

        // Fetch Invoices (Real Data)
        const invoices = await prisma.invoice.findMany({
            where: whereDate,
            include: { customer: true, items: true } as any,
            orderBy: { createdAt: 'asc' }
        });

        // Calculate Accumulated Revenue (Year-to-Date) for Tax Exemption Check
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59);

        const yearlyStats = await prisma.invoice.aggregate({
            _sum: { totalAmount: true },
            where: {
                storeId: storeId as any,
                createdAt: { gte: startOfYear, lte: endOfYear }
            }
        });
        const accumulatedRevenue = Number(yearlyStats._sum.totalAmount || 0);

        // NEW REGULATION 2026: Threshold increased to 200M
        const TAX_THRESHOLD = year >= 2026 ? 200000000 : 100000000;
        const isTaxExempt = accumulatedRevenue <= TAX_THRESHOLD;

        // 1. Phân phối, cung cấp hàng hóa: GTGT 1%, TNCN 0.5%
        // 2. Dịch vụ, xây dựng: GTGT 5%, TNCN 2%
        // 3. Sản xuất, vận tải: GTGT 3%, TNCN 1.5%
        const taxRates = {
            vat: isTaxExempt ? 0 : 0.01,
            pit: isTaxExempt ? 0 : 0.005
        };

        let totalRevenue = 0;

        // Process Daily Invoices
        const invoiceData = (invoices as any[]).map(inv => {
            const revenue = Number(inv.totalAmount);
            totalRevenue += revenue; // Monthly Revenue
            return {
                id: inv.code,
                date: new Date(inv.createdAt).toLocaleDateString('vi-VN'),
                desc: 'Bán hàng hóa, dịch vụ',
                buyer: inv.customer?.name || 'Khách lẻ',
                revenue: revenue,
                returnAmount: 0,
                vat: Math.round(revenue * taxRates.vat),
                pit: Math.round(revenue * taxRates.pit)
            };
        });

        const summary = {
            total_revenue: totalRevenue,
            vat_amount: Math.round(totalRevenue * taxRates.vat),
            pit_amount: Math.round(totalRevenue * taxRates.pit),
            total_tax: Math.round(totalRevenue * (taxRates.vat + taxRates.pit)),
            accumulated_revenue: accumulatedRevenue, // Return for frontend progress bar
            tax_threshold: TAX_THRESHOLD,
            is_exempt: isTaxExempt
        };

        if (type === 'tax') {
            res.json({
                summary,
                invoices: invoiceData
            });
            return;
        }

        // Accounting Books Logic (TT88)
        let bookData: any[] = [];

        // AUTO-SEED DEMO DATA for AUDIT (If empty)
        // Check S3
        const expenseCount = await (prisma as any).expense.count({ where: { storeId } });
        if (expenseCount === 0) {
            await (prisma as any).expense.createMany({
                data: [
                    { storeId, date: new Date(year, month - 1, 5), amount: 1250000, category: 'electricity', description: 'Thanh toán tiền điện tháng ' + month, paymentMethod: 'CASH', invoiceCode: 'PC001' },
                    { storeId, date: new Date(year, month - 1, 10), amount: 450000, category: 'materials', description: 'Mua túi nilon, bao bì', paymentMethod: 'CASH', invoiceCode: 'PC003' },
                    { storeId, date: new Date(year, month - 1, 15), amount: 5000000, category: 'goods_import', description: 'Thanh toán tiền nhập hàng', paymentMethod: 'TRANSFER', invoiceCode: 'UNC001' },
                    { storeId, date: new Date(year, month - 1, 28), amount: 120000, category: 'water', description: 'Tiền nước sinh hoạt', paymentMethod: 'CASH', invoiceCode: 'PC005' }
                ]
            });
        }

        // Check S4
        const taxCount = await (prisma as any).taxPayment.count({ where: { storeId } });
        if (taxCount === 0) {
            await (prisma as any).taxPayment.createMany({
                data: [
                    { storeId, date: new Date(year, month - 1, 20), amount: 3000000, taxType: 'vat', description: 'Nộp thuế GTGT Quý 1', paymentMethod: 'TRANSFER', receiptCode: 'NT001' },
                    { storeId, date: new Date(year, month - 1, 20), amount: 1500000, taxType: 'pit', description: 'Nộp thuế TNCN Quý 1', paymentMethod: 'TRANSFER', receiptCode: 'NT002' }
                ]
            });
        }

        // Check S5
        const salaryCount = await (prisma as any).salaryPayment.count({ where: { storeId } });
        if (salaryCount === 0) {
            await (prisma as any).salaryPayment.createMany({
                data: [
                    { storeId, month, year, employeeName: 'Nguyễn Văn A', baseSalary: 6000000, bonus: 500000, totalAmount: 6500000, paymentDate: new Date(year, month - 1, 5) },
                    { storeId, month, year, employeeName: 'Trần Thị B', baseSalary: 5000000, bonus: 0, totalAmount: 5000000, paymentDate: new Date(year, month - 1, 5) }
                ]
            });
        }

        // Check S2 (Inventory Import)
        const importCount = await (prisma as any).importReceipt.count({ where: { storeId } });
        if (importCount === 0) {
            await (prisma as any).importReceipt.create({
                data: {
                    storeId,
                    code: 'NK001',
                    supplier: 'Nhà cung cấp A',
                    importDate: new Date(year, month - 1, 1),
                    totalAmount: 10000000,
                    note: 'Nhập hàng đầu tháng',
                    items: {
                        create: [
                            { productId: 1, quantity: 100, importPrice: 5000 }, // Mock Product IDs
                            { productId: 2, quantity: 200, importPrice: 10000 }
                        ]
                    }
                }
            });
        }


        switch (book) {
            case 's1': // Sổ doanh thu
                // Add T-VAN simulation fields
                bookData = invoiceData.map((inv: any) => ({
                    ...inv,
                    invoiceSymbol: '1C25TZA', // Ký hiệu mẫu số hóa đơn giả định
                    taxCode: '25C' + Math.random().toString(36).substring(2, 10).toUpperCase(), // Mã CQT giả lập
                    tvanStatus: Math.random() > 0.1 ? 'SENT' : 'PENDING' // 90% đã gửi
                }));
                break;
            case 's2': // Sổ vật tư, hàng hóa
                // 1. Fetch Imports (Sử dụng ImportReceipt vừa tạo)
                const imports = await (prisma as any).importReceipt.findMany({
                    where: {
                        storeId: storeId,
                        importDate: { gte: startDate, lte: endDate }
                    },
                    include: { items: { include: { product: true } } }
                });

                // 2. Fetch Exports (Invoice Items)
                const exports = await prisma.invoice.findMany({
                    where: whereDate,
                    include: { items: { include: { product: true } } } as any
                });

                // 3. Transform to Ledger
                const importEntries = imports.flatMap((rec: any) =>
                    rec.items.map((item: any) => ({
                        date: new Date(rec.importDate),
                        code: rec.code,
                        desc: `Nhập kho: ${item.product?.name}`,
                        name: item.product?.name,
                        unit: item.product?.unit || 'Cái',
                        in: item.quantity,
                        out: 0,
                        hasInvoice: true
                    }))
                );

                const exportEntries = (exports as any[]).flatMap(inv =>
                    inv.items.map((item: any) => ({
                        date: new Date(inv.createdAt),
                        code: inv.code,
                        desc: `Xuất bán: ${item.product?.name}`,
                        name: item.product?.name,
                        unit: item.product?.unit || 'Cái',
                        in: 0,
                        out: item.quantity,
                        hasInvoice: true
                    }))
                );

                // 4. Combine & Sort
                bookData = [...importEntries, ...exportEntries]
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .map(item => {
                        // Mock Stock Calculation (Since we don't have opening balance yet)
                        // Ideally: runningStock += in - out
                        return {
                            ...item,
                            date: item.date.toLocaleDateString('vi-VN'),
                            stock: 0 // Placeholder until Opening Balance is implemented
                        };
                    });

                // Simple Running Balance Calculation
                let runStock = 0;
                bookData = bookData.map(item => {
                    runStock += item.in - item.out;
                    return { ...item, stock: runStock };
                });
                break;
            case 's3': // Sổ chi phí SXKD
                const expenses = await (prisma as any).expense.findMany({
                    where: {
                        storeId: storeId,
                        date: { gte: startDate, lte: endDate }
                    },
                    orderBy: { date: 'asc' }
                });
                bookData = expenses.map((e: any) => ({
                    date: new Date(e.date).toLocaleDateString('vi-VN'),
                    doc: e.invoiceCode || `PC${e.id}`,
                    desc: e.description || e.category,
                    in: 0,
                    out: Number(e.amount),
                    type: e.category
                }));
                break;
            case 's4': // Sổ thanh toán thuế
                const taxPayments = await (prisma as any).taxPayment.findMany({
                    where: {
                        storeId: storeId,
                        date: { gte: startDate, lte: endDate }
                    },
                    orderBy: { date: 'asc' }
                });
                bookData = taxPayments.map((t: any) => ({
                    date: new Date(t.date).toLocaleDateString('vi-VN'),
                    doc: t.receiptCode || `NT${t.id}`,
                    desc: `${t.taxType} - ${t.description || ''}`,
                    amount: Number(t.amount),
                    type: t.taxType
                }));
                break;
            case 's5': // Sổ thanh toán tiền lương
                const salaries = await (prisma as any).salaryPayment.findMany({
                    where: {
                        storeId: storeId,
                        month: month,
                        year: year
                    },
                    orderBy: { createdAt: 'asc' }
                });
                bookData = salaries.map((s: any) => ({
                    date: new Date(s.paymentDate).toLocaleDateString('vi-VN'),
                    name: s.employeeName || 'Nhân viên',
                    role: 'N/A', // Role handling requires User relation or extra field
                    salary: Number(s.baseSalary),
                    bonus: Number(s.bonus),
                    total: Number(s.totalAmount)
                }));
                break;
            case 's6': // Sổ quỹ tiền mặt
            case 's7': // Tiền gửi ngân hàng
                const isCashBook = book === 's6';
                const method = isCashBook ? 'CASH' : 'TRANSFER';

                // ===============================================
                // 1. CALCULATE OPENING BALANCE (Dư đầu kỳ)
                // ===============================================
                // Sum all transactions BEFORE startDate
                // Note: For production, we should use AccountingPeriod snapshots. 
                // Here we calculate dynamically from start for accuracy.

                // INFLOWS (Revenue)
                const prevInvoices = await prisma.invoice.aggregate({
                    _sum: { totalAmount: true },
                    where: {
                        storeId,
                        createdAt: { lt: startDate },
                        paymentMethod: method
                    }
                });

                // OUTFLOWS
                // a. Expenses
                const prevExpenses = await (prisma as any).expense.aggregate({
                    _sum: { amount: true },
                    where: {
                        storeId,
                        date: { lt: startDate },
                        paymentMethod: method
                    }
                });

                // b. Tax
                const prevTax = await (prisma as any).taxPayment.aggregate({
                    _sum: { amount: true },
                    where: {
                        storeId,
                        date: { lt: startDate },
                        paymentMethod: method
                    }
                });

                // c. Imports (Chi mua hàng)
                // TT88/Tax Regulation: >= 20M must be Bank, < 20M can be Cash
                // We assume this logic for ImportReceipts since they lack paymentMethod field
                const prevImports = await (prisma as any).importReceipt.findMany({
                    where: {
                        storeId,
                        importDate: { lt: startDate }
                    },
                    select: { totalAmount: true }
                });

                let prevImportTotal = 0;
                prevImports.forEach((imp: any) => {
                    const amount = Number(imp.totalAmount);
                    const isTransfer = amount >= 20000000;
                    if (isCashBook && !isTransfer) prevImportTotal += amount;
                    if (!isCashBook && isTransfer) prevImportTotal += amount;
                });

                const openingBalance = (Number(prevInvoices._sum.totalAmount) || 0)
                    - (Number(prevExpenses._sum.amount) || 0)
                    - (Number(prevTax._sum.amount) || 0)
                    - prevImportTotal;

                // ===============================================
                // 2. FETCH CURRENT PERIOD TRANSACTIONS
                // ===============================================

                // Inflows
                const periodInvoices = (invoices as any[])
                    .filter(inv => inv.paymentMethod === method)
                    .map(inv => ({
                        date: new Date(inv.createdAt),
                        doc: inv.code,
                        desc: `Thu tiền bán hàng (${isCashBook ? 'Tiền mặt' : 'CK'})`,
                        in: Number(inv.totalAmount),
                        out: 0
                    }));

                // Outflows: Expenses
                const periodExpenses = await (prisma as any).expense.findMany({
                    where: {
                        storeId: storeId,
                        date: { gte: startDate, lte: endDate },
                        paymentMethod: method
                    }
                });
                const expenseEntries = periodExpenses.map((e: any) => ({
                    date: new Date(e.date),
                    doc: e.invoiceCode || `PC${e.id}`,
                    desc: e.description || e.category,
                    in: 0,
                    out: Number(e.amount)
                }));

                // Outflows: Tax
                const periodTax = await (prisma as any).taxPayment.findMany({
                    where: {
                        storeId: storeId,
                        date: { gte: startDate, lte: endDate },
                        paymentMethod: method
                    }
                });
                const taxEntries = periodTax.map((t: any) => ({
                    date: new Date(t.date),
                    doc: t.receiptCode || `NT${t.id}`,
                    desc: `Nộp thuế: ${t.taxType}`,
                    in: 0,
                    out: Number(t.amount)
                }));

                // Outflows: Imports
                const periodImports = await (prisma as any).importReceipt.findMany({
                    where: {
                        storeId: storeId,
                        importDate: { gte: startDate, lte: endDate }
                    }
                });

                const cashImportEntries: any[] = [];
                periodImports.forEach((imp: any) => {
                    const amount = Number(imp.totalAmount);
                    const isTransfer = amount >= 20000000;
                    if ((isCashBook && !isTransfer) || (!isCashBook && isTransfer)) {
                        cashImportEntries.push({
                            date: new Date(imp.importDate),
                            doc: imp.code || `NK${imp.id}`,
                            desc: `Chi mua hàng (${imp.supplier || 'NCC'})`,
                            in: 0,
                            out: amount
                        });
                    }
                });


                // ===============================================
                // 3. COMBINE & CALCULATE RUNNING BALANCE
                // ===============================================
                const allTrans = [...periodInvoices, ...expenseEntries, ...taxEntries, ...cashImportEntries]
                    .sort((a, b) => a.date.getTime() - b.date.getTime());

                let currentBalance = openingBalance;

                // Add Opening Balance as first row? 
                // S6/S7 usually shows "Số dư đầu kỳ" as first line
                bookData = [
                    {
                        date: startDate.toLocaleDateString('vi-VN'),
                        doc: '---',
                        desc: 'Số dư đầu kỳ',
                        in: 0,
                        out: 0,
                        balance: currentBalance
                    }
                ];

                allTrans.forEach(t => {
                    currentBalance += (t.in - t.out);
                    bookData.push({
                        ...t,
                        date: t.date.toLocaleDateString('vi-VN'),
                        balance: currentBalance
                    });
                });
                break;
            default:
                bookData = [];
        }

        res.json({
            summary,
            bookType: book,
            bookData: bookData
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};
