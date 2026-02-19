import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/database';

/**
 * Webhook Controller for Automatic Payment Processing
 * Compatible with automated bank transfer (Casso/SePay) or Payment Gateways
 */
export const handlePaymentWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. Verify Signature (Security) - Example for general HMAC verification
        // In reality, replace with the specific verification logic of the provider (MoMo, PayOS, etc.)
        const signature = req.headers['x-api-signature'] as string;
        const secret = process.env.PAYMENT_WEBHOOK_SECRET || 'secret';

        const payload = JSON.stringify(req.body);
        const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

        // Note: For development, we might skip signature check if secret is 'demo-mode'
        if (secret !== 'demo-mode' && signature !== expectedSignature) {
            console.error('Invalid Webhook Signature');
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const data = req.body;
        // Expected data format (General):
        // { orderCode: "POS123", amount: 500000, status: "PAID", transactionId: "BANK_TRANS_999" }

        const { orderCode, amount, status, transactionId } = data;

        if (status !== 'PAID' && status !== 'SUCCESS') {
            res.status(200).json({ status: 'ignored' });
            return;
        }

        // 2. Find Payment Record in Database
        const payment = await prisma.payment.findFirst({
            where: {
                transactionRef: orderCode, // We stored orderCode here during checkout
                status: 'pending'
            },
            include: {
                store: {
                    include: { subscriptionPlan: true }
                }
            }
        });

        if (!payment) {
            console.warn(`Payment record not found for Order: ${orderCode}`);
            res.status(404).json({ error: 'Payment not found' });
            return;
        }

        // 3. ATOMIC UPDATE (Transaction)
        // We use Prisma transaction to ensure data integrity
        await prisma.$transaction(async (tx) => {
            // A. Update Payment
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'completed',
                    paidAt: new Date(),
                    transactionRef: transactionId || orderCode // Store the real external ID
                }
            });

            // B. Calculate new Expiry Date
            // Use current expiry if not yet expired, otherwise use now.
            const currentExpiry = payment.store.subscriptionExpiredAt;
            const now = new Date();
            const baseDate = (currentExpiry && currentExpiry > now) ? currentExpiry : now;

            // Default 30 days if plan duration not set
            const durationDays = payment.store.subscriptionPlan?.durationDays || 30;
            const newExpiry = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

            // C. Update Store Subscription & Status
            await tx.store.update({
                where: { id: payment.storeId },
                data: {
                    status: 'active',
                    subscriptionExpiredAt: newExpiry
                }
            });

            // D. Create Subscription History Record
            await tx.storeSubscription.create({
                data: {
                    storeId: payment.storeId,
                    planId: payment.store.subscriptionPlanId || 1, // Fallback to basic
                    startDate: baseDate,
                    endDate: newExpiry,
                    status: 'active',
                    paymentId: payment.id
                }
            });

            // E. System Log
            await tx.systemLog.create({
                data: {
                    storeId: payment.storeId,
                    action: 'SUBSCRIPTION_RENEW_AUTO',
                    entityType: 'STORE_SUBSCRIPTION',
                    newData: JSON.stringify({
                        orderCode,
                        amount,
                        newExpiry,
                        plan: payment.store.subscriptionPlan?.name
                    })
                }
            });
        });

        console.log(`✅ Success: Store ${payment.storeId} renewed until ${orderCode}`);
        res.status(200).json({ success: true, message: 'Subscription activated' });

    } catch (error: any) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
