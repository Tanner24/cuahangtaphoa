import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPerformance() {
    console.log('🚀 Bắt đầu nạp dữ liệu hiệu năng cao...');

    // 1. Lấy cửa hàng mặc định
    const store = await prisma.store.findFirst();
    if (!store) {
        console.error('❌ Không tìm thấy cửa hàng nào. Vui lòng chạy seed cơ bản trước.');
        return;
    }
    const storeId = store.id;

    // 2. Tạo Danh mục (nếu chưa có)
    const catMap: Record<string, number> = {};
    const categories = ['Sữa & Chế phẩm', 'Đồ uống có cồn', 'Thực phẩm ăn liền', 'Gia vị', 'Hóa mỹ phẩm'];

    for (const name of categories) {
        const cat = await prisma.category.upsert({
            where: { storeId_name: { storeId, name } },
            update: {},
            create: { name, storeId }
        });
        catMap[name] = cat.id;
    }

    // 3. Dữ liệu mẫu (Dutch Lady, Hao Hao, Tiger)
    const products = [
        {
            name: 'Sữa đặc Cô gái Hà Lan 380g',
            barcode: '8934673601025',
            unit: 'Lon',
            costPrice: 18500,
            retailPrice: 24000,
            cat: 'Sữa & Chế phẩm',
            stock: 48,
            expiry: new Date('2025-12-31')
        },
        {
            name: 'Mì Hảo Hảo Tôm Chua Cay 75g',
            barcode: '8934563138164',
            unit: 'Gói',
            costPrice: 3200,
            retailPrice: 4500,
            cat: 'Thực phẩm ăn liền',
            stock: 200,
            expiry: new Date('2024-06-30')
        },
        {
            name: 'Mì Hảo Hảo Tôm Chua Cay (Thùng 30 gói)',
            barcode: '8934563138165',
            unit: 'Thùng',
            costPrice: 92000,
            retailPrice: 125000, // Giá thùng rẻ hơn
            cat: 'Thực phẩm ăn liền',
            stock: 10,
            expiry: new Date('2024-06-30')
        },
        {
            name: 'Bia Tiger Crystal 330ml',
            barcode: '8888005310022',
            unit: 'Lon',
            costPrice: 14500,
            retailPrice: 18000,
            cat: 'Đồ uống có cồn',
            stock: 120,
            expiry: new Date('2024-12-31')
        },
        {
            name: 'Bia Tiger Crystal (Thùng 24 lon)',
            barcode: '8888005310023',
            unit: 'Thùng',
            costPrice: 340000,
            retailPrice: 410000,
            cat: 'Đồ uống có cồn',
            stock: 5,
            expiry: new Date('2024-12-31')
        }
    ];

    for (const p of products) {
        // Kiểm tra xem sản phẩm đã tồn tại chưa
        let product = await prisma.product.findFirst({
            where: { storeId, barcode: p.barcode }
        });

        if (!product) {
            console.log(`➕ Tạo mới: ${p.name}`);
            product = await prisma.product.create({
                data: {
                    storeId,
                    name: p.name,
                    barcode: p.barcode,
                    unit: p.unit,
                    price: p.retailPrice,
                    priceIn: p.costPrice,
                    categoryId: catMap[p.cat],
                    currentStock: p.stock, // Cache total
                }
            });
        }

        // Tạo Inventory (Lô hàng)
        // Kiểm tra xem đã có lô hàng nào cho sp này chưa
        const inv = await prisma.inventory.create({
            data: {
                storeId,
                productId: product.id,
                quantity: p.stock,
                minStock: 5,
                expiryDate: p.expiry,
                batchCode: `BATCH-${Date.now()}`,
                location: 'Kệ A1'
            }
        });
        console.log(`   📦 Nhập kho: ${p.name} - SL: ${p.stock} - HSD: ${p.expiry.toISOString().split('T')[0]}`);
    }

    console.log('✅ Hoàn tất nạp dữ liệu mẫu!');
}

seedPerformance()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
