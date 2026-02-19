import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Checking for Super Admin...');

    const superAdmin = await prisma.user.findFirst({
        where: { role: 'super_admin' },
        include: { store: true },
    });

    if (!superAdmin) {
        console.error('❌ No Super Admin found! Please run upgrade_role.php or seed first.');
        process.exit(1);
    }

    console.log(`✅ Found Super Admin: ${superAdmin.username} (Store: ${superAdmin.store?.name}, ID: ${superAdmin.storeId})`);

    const adminStoreId = superAdmin.storeId;
    const defaultPassword = 'password123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const rolesToAdd = [
        {
            username: 'support_admin',
            role: 'support_admin',
            fullName: 'Support Team',
            passwordHash: passwordHash
        },
        {
            username: 'sales_admin',
            role: 'billing_admin',
            fullName: 'Sales Team',
            passwordHash: passwordHash
        }
    ];

    for (const admin of rolesToAdd) {
        const existing = await prisma.user.findFirst({
            where: {
                storeId: adminStoreId,
                username: admin.username
            }
        });

        if (existing) {
            console.log(`ℹ️ Admin user '${admin.username}' already exists. Skipping.`);
        } else {
            await prisma.user.create({
                data: {
                    storeId: adminStoreId,
                    username: admin.username,
                    passwordHash: admin.passwordHash,
                    fullName: admin.fullName,
                    role: admin.role,
                }
            });
            console.log(`✅ Created admin user: ${admin.username} (Role: ${admin.role})`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
