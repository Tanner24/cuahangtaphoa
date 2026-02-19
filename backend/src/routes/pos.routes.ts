import express from 'express';
import { authenticate } from '../middleware/auth';
import {
    getProducts,
    getProductByBarcode,
    createProduct,
    updateProduct,
    deleteProduct,
    lookupBarcodeByOFF
} from '../controllers/pos.product.controller';
import { createOrder, getMyOrders } from '../controllers/pos.order.controller';
import { searchCustomers, createCustomer } from '../controllers/pos.customer.controller';
import { getPosDashboard } from '../controllers/pos.dashboard.controller';
import { getDebtors } from '../controllers/pos.debt.controller';
import { getReportData } from '../controllers/pos.report.controller';
import { getStoreInfo, updateStoreInfo } from '../controllers/pos.store.controller'; // NEW
import { getLatestAnnouncement } from '../controllers/announcement.controller';
import { getSystemSettings } from '../controllers/system.controller';
import { getStoreUsers, createStoreUser, updateStoreUser, deleteStoreUser } from '../controllers/pos.user.controller';
import { createTicket, getMyTickets, getTicketDetail, addMessage } from '../controllers/support.controller';

const router = express.Router();

router.use(authenticate); // Tất cả route POS phải login

// Dashboard
router.get('/dashboard', getPosDashboard);

// Sản phẩm
router.get('/products', getProducts);
router.post('/products', createProduct);
router.get('/products/:barcode', getProductByBarcode);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.get('/products/lookup/:barcode', lookupBarcodeByOFF); // Global Lookup

// Đơn hàng
router.post('/orders', createOrder);
router.get('/orders', getMyOrders);

// Khách hàng
router.get('/customers', searchCustomers);
router.post('/customers', createCustomer);

// Trả hàng (Refunds)
import { getRefunds, createRefund } from '../controllers/pos.refund.controller';
router.get('/refunds', getRefunds);
router.post('/refunds', createRefund);

// Công nợ
router.get('/debts', getDebtors);

// Báo cáo
import { createAccountingEntry } from '../controllers/pos.accounting.controller';
import { signReport } from '../controllers/pos.report.controller';
router.get('/reports', getReportData);
router.post('/reports/sign', signReport);
router.post('/accounting', createAccountingEntry);

// Cửa hàng (Settings)
router.get('/store', getStoreInfo);
router.put('/store', updateStoreInfo);

// Quản lý nhân viên
router.get('/users', getStoreUsers);
router.post('/users', createStoreUser);
router.put('/users/:id', updateStoreUser);
router.delete('/users/:id', deleteStoreUser);

// System Logs
import { getSystemLogs } from '../controllers/pos.log.controller';
router.get('/logs', getSystemLogs);

// Announcements
router.get('/announcements/latest', getLatestAnnouncement);

// System Settings
router.get('/settings', getSystemSettings);

// Support Tickets
router.get('/tickets', getMyTickets);
router.post('/tickets', createTicket);
router.get('/tickets/:id', getTicketDetail);
router.post('/tickets/:id/messages', addMessage);

export default router;
