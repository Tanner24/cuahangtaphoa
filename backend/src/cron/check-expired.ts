import prisma from '../config/database';

async function checkExpiredStores() {
    console.log('🕐 Kiểm tra stores hết hạn...');
    const now = new Date();

    const expiredStores = await prisma.store.findMany({
        where: { status: 'active', subscriptionExpiredAt: { lt: now } },
    });

    if (expiredStores.length === 0) {
        console.log('✅ Không có store nào hết hạn.');
        return;
    }

    for (const store of expiredStores) {
        await prisma.store.update({ where: { id: store.id }, data: { status: 'expired' } });
        await prisma.storeSubscription.updateMany({
            where: { storeId: store.id, status: 'active', endDate: { lt: now } },
            data: { status: 'expired' },
        });
        await prisma.systemLog.create({
            data: {
                action: 'AUTO_EXPIRE_STORE',
                entityType: 'store',
                entityId: String(store.id),
                storeId: store.id,
                newData: JSON.stringify({ storeName: store.name, expiredAt: store.subscriptionExpiredAt }), // SQLite specific
            },
        });
        console.log(`  ❌ "${store.name}" - Hết hạn`);
    }
    console.log(`🏁 Đã xử lý ${expiredStores.length} store(s).`);
}

checkExpiredStores()
    .catch((e) => { console.error('❌ Cron lỗi:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
