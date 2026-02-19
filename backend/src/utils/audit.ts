
import prisma from '../config/database'; // Adjust path if needed

interface AuditLogParams {
    storeId: number;
    userId: number; // User making the change
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    entity: string; // 'Product', 'Invoice'
    entityId: string;
    oldData?: any; // Snapshot before
    newData?: any; // Snapshot after
    ipAddress?: string;
    device?: string;
}

export const logAudit = async (params: AuditLogParams) => {
    try {
        await (prisma as any).appLog.create({
            data: {
                storeId: params.storeId,
                userId: params.userId,
                action: params.action,
                entity: params.entity,
                entityId: params.entityId,
                oldData: params.oldData ? JSON.stringify(params.oldData) : null,
                newData: params.newData ? JSON.stringify(params.newData) : null,
                ipAddress: params.ipAddress || 'unknown',
                device: params.device || 'unknown'
            }
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // We do not throw error here to avoid blocking main business logic
    }
};
