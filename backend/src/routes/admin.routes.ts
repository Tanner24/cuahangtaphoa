import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import {
    getStores,
    createStore,
    updateStore,
    suspendStore,
    activateStore,
    getStoreDetail,
    subscribeStore,
    extendStore,
    resetStorePassword
} from '../controllers/store.controller';

// ... (existing routes)

router.post(
    '/stores/:id/reset-password',
    authorize('super_admin'),
    auditLog('RESET_PASSWORD', 'store'),
    resetStorePassword
);
import { getDashboard } from '../controllers/dashboard.controller';
import { createAnnouncement, getAnnouncements } from '../controllers/announcement.controller';
import { getPlans, createPlan, updatePlan, deletePlan } from '../controllers/plan.controller';
import { getSystemSettings, updateSystemSetting } from '../controllers/system.controller';
import { getAllTickets, getTicketDetail, addMessage as addTicketMessage, updateTicketStatus } from '../controllers/support.controller';

const router = Router();

// Tất cả admin routes đều cần authenticated
router.use(authenticate);

// ============ Dashboard ============
router.get(
    '/dashboard',
    authorize('super_admin'),
    getDashboard
);

// ============ Stores ============
router.get(
    '/stores',
    authorize('super_admin'),
    getStores
);
router.post(
    '/stores',
    authorize('super_admin'),
    auditLog('CREATE_STORE', 'store'),
    createStore
);
router.get(
    '/stores/:id',
    authorize('super_admin'),
    getStoreDetail
);
router.put(
    '/stores/:id',
    authorize('super_admin'),
    auditLog('UPDATE_STORE', 'store'),
    updateStore
);
router.patch(
    '/stores/:id/suspend',
    authorize('super_admin'),
    auditLog('SUSPEND_STORE', 'store'),
    suspendStore
);
router.patch(
    '/stores/:id/activate',
    authorize('super_admin'),
    auditLog('ACTIVATE_STORE', 'store'),
    activateStore
);
router.post(
    '/stores/:id/subscribe',
    authorize('super_admin'),
    auditLog('SUBSCRIBE_STORE', 'store'),
    subscribeStore
);
router.patch(
    '/stores/:id/extend',
    authorize('super_admin'),
    auditLog('EXTEND_STORE', 'store'),
    extendStore
);

// ============ Plans ============
router.get(
    '/plans',
    authorize('super_admin'),
    getPlans
);
router.post(
    '/plans',
    authorize('super_admin'),
    createPlan
);
router.put(
    '/plans/:id',
    authorize('super_admin'),
    updatePlan
);
router.delete(
    '/plans/:id',
    authorize('super_admin'),
    deletePlan
);

// ============ Utilities ============
router.post(
    '/announcements',
    authorize('super_admin'),
    createAnnouncement
);
router.get(
    '/announcements',
    authorize('super_admin'),
    getAnnouncements
);

// ============ System Settings ============
router.get(
    '/settings',
    authorize('super_admin'),
    getSystemSettings
);
router.post(
    '/settings',
    authorize('super_admin'),
    updateSystemSetting
);

// ============ Support Tickets ============
router.get(
    '/tickets',
    authorize('super_admin'),
    getAllTickets
);
router.get(
    '/tickets/:id',
    authorize('super_admin'),
    getTicketDetail
);
router.post(
    '/tickets/:id/messages',
    authorize('super_admin'),
    addTicketMessage
);
router.put(
    '/tickets/:id/status',
    authorize('super_admin'),
    updateTicketStatus
);

export default router;
