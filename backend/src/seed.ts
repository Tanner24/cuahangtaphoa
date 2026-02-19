import bcrypt from 'bcrypt';
import prisma from './config/database';
import { config } from './config';

async function seed() {
    console.log('🌱 Bắt đầu seed database...\n');

    // 1. Tạo Subscription Plans
    const plansData = [
        { name: 'Free', maxProducts: 50, maxUsers: 1, price: 0, durationDays: 365, features: JSON.stringify({ reports: false, multiDevice: false }) },
        { name: 'Pro', maxProducts: 500, maxUsers: 5, price: 199000, durationDays: 30, features: JSON.stringify({ reports: true, multiDevice: true }) },
        { name: 'Premium', maxProducts: 999999, maxUsers: 20, price: 499000, durationDays: 30, features: JSON.stringify({ reports: true, multiDevice: true, api: true }) },
    ];

    for (const p of plansData) {
        const existing = await prisma.subscriptionPlan.findUnique({ where: { name: p.name } });
        if (!existing) {
            await prisma.subscriptionPlan.create({ data: p });
            console.log(`  ✅ Plan "${p.name}" created`);
        } else {
            console.log(`  ⏭️ Plan "${p.name}" already exists`);
        }
    }

    // 2. Tạo System Store (cho admin users)
    let systemStore = await prisma.store.findFirst({ where: { name: 'System Admin' } });
    if (!systemStore) {
        systemStore = await prisma.store.create({
            data: { name: 'System Admin', ownerName: 'System', phone: '0000000000', status: 'active' },
        });
        console.log(`  ✅ System store created (ID: ${systemStore.id})`);
    } else {
        console.log(`  ⏭️ System store already exists (ID: ${systemStore.id})`);
    }

    // 3. Tạo Super Admin
    const passwordHash = await bcrypt.hash(config.admin.defaultPassword, 12);
    let admin = await prisma.user.findFirst({
        where: { storeId: systemStore.id, username: 'admin' },
    });
    if (!admin) {
        admin = await prisma.user.create({
            data: {
                storeId: systemStore.id,
                username: 'admin',
                passwordHash,
                fullName: 'Super Administrator',
                role: 'super_admin',
            },
        });
        console.log(`  ✅ Super Admin created (ID: ${admin.id})`);
    } else {
        await prisma.user.update({ where: { id: admin.id }, data: { passwordHash } });
        console.log(`  ⏭️ Super Admin already exists, password updated`);
    }

    // 4. Demo store
    const freePlan = await prisma.subscriptionPlan.findFirst({ where: { name: 'Free' } });
    let demoStore = await prisma.store.findFirst({ where: { phone: '0901234567' } });
    if (!demoStore) {
        demoStore = await prisma.store.create({
            data: {
                name: 'Tạp Hóa Minh Anh (Demo)',
                ownerName: 'Nguyễn Văn A',
                phone: '0901234567',
                email: 'demo@taphoaminhanh.com',
                status: 'active',
                subscriptionPlanId: freePlan?.id,
                subscriptionExpiredAt: new Date(Date.now() + 365 * 86400000),
            },
        });
        console.log(`  ✅ Demo store created: ${demoStore.name}`);
    }

    // 5. Demo store owner
    let demoOwner = await prisma.user.findFirst({
        where: { storeId: demoStore.id, username: 'owner' },
    });
    if (!demoOwner) {
        const demoPass = await bcrypt.hash('123456', 12);
        await prisma.user.create({
            data: {
                storeId: demoStore.id,
                username: 'owner',
                passwordHash: demoPass,
                fullName: 'Nguyễn Văn A',
                role: 'owner',
            },
        });
        console.log(`  ✅ Demo owner created: owner / 123456`);
    }

    console.log('\n🎉 Seed hoàn tất!');
    console.log(`\n📋 Admin Login: admin / ${config.admin.defaultPassword}`);
}

seed()
    .catch((e) => { console.error('❌ Seed thất bại:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
