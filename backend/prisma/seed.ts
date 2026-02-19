import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // 1. Subscription Plan
    const plan = await prisma.subscriptionPlan.upsert({
        where: { name: 'Basic' },
        update: {},
        create: {
            name: 'Basic',
            price: 0,
            maxProducts: 100,
            maxUsers: 5,
            features: JSON.stringify(['basic_pos', 'reports'])
        }
    });

    // 2. Store
    // Find store by phone (since phone is unique in schema: phone String? @unique)
    let store = await prisma.store.findUnique({
        where: { phone: '0987654321' }
    });

    if (!store) {
        store = await prisma.store.create({
            data: {
                name: 'Cửa hàng Minh Anh',
                phone: '0987654321',
                address: '123 Đường Láng, Hà Nội',
                status: 'active',
                subscriptionPlanId: plan.id
            }
        });
    }

    // 3. Admin User
    const passwordHash = await bcrypt.hash('123456', 10);

    // User unique constraint is @@unique([storeId, username])
    const existingUser = await prisma.user.findFirst({
        where: {
            storeId: store.id,
            username: 'admin'
        }
    });

    if (!existingUser) {
        await prisma.user.create({
            data: {
                username: 'admin',
                passwordHash: passwordHash, // Fix: password -> passwordHash
                fullName: 'Chủ Cửa Hàng',
                role: 'admin',
                storeId: store.id
            }
        });
    }

    // 4. Products
    const products = [
        { barcode: '8934567890123', name: 'Nước ngọt Pepsi 330ml', price: 10000, stock: 50, unit: 'Lon', category: 'Đồ uống' },
        { barcode: '8931234567890', name: 'Bánh Snack Oishi Tôm Cay', price: 5000, stock: 100, unit: 'Gói', category: 'Ăn vặt' },
        { barcode: 'SP001', name: 'Dầu ăn Neptune 1L', price: 45000, stock: 20, unit: 'Chai', category: 'Gia vị' },
    ];

    for (const p of products) {
        // Manual check since no unique constraint on barcode+storeId
        const exist = await prisma.product.findFirst({
            where: { storeId: store.id, barcode: p.barcode }
        });

        if (!exist) {
            const { stock, ...productData } = p; // Remove 'stock' from spread
            await prisma.product.create({
                data: {
                    ...productData,
                    storeId: store.id,
                    currentStock: stock // Map stock to currentStock
                }
            });
        }
    }

    // 5. Customer
    const customerPhone = '0909000111';
    const existCust = await prisma.customer.findFirst({
        where: { storeId: store.id, phone: customerPhone }
    });

    if (!existCust) {
        await prisma.customer.create({
            data: {
                name: 'Nguyễn Văn A',
                phone: customerPhone,
                address: 'Hà Nội',
                storeId: store.id
            }
        });
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
