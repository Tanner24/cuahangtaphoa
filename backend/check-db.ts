import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Database Status ---');

    try {
        const storeCount = await prisma.store.count();
        console.log(`Stores: ${storeCount}`);

        if (storeCount > 0) {
            const stores = await prisma.store.findMany({ select: { id: true, name: true, phone: true } });
            console.table(stores);
        }

        const userCount = await prisma.user.count();
        console.log(`Users: ${userCount}`);

        const productCount = await prisma.product.count();
        console.log(`Products: ${productCount}`);

        const customerCount = await prisma.customer.count();
        console.log(`Customers: ${customerCount}`);

        const invoiceCount = await prisma.invoice.count();
        console.log(`Invoices: ${invoiceCount}`);

    } catch (error) {
        console.error('Error connecting to database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
