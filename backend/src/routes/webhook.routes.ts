import express from 'express';
import { handlePaymentWebhook } from '../controllers/webhook.controller';

const router = express.Router();

/**
 * PUBLIC ROUTE: Webhook for payment gateways
 * Security is handled via HMAC Signature check inside the controller
 */
router.post('/payment-success', handlePaymentWebhook);

export default router;
