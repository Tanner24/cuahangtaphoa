import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedData() {
    console.log('🌱 Bắt đầu nạp dữ liệu mẫu cho POS...');

    // 1. Tìm cửa hàng Demo
    const demoStore = await prisma.store.findFirst({
        where: { phone: '0901234567' }
    });

    if (!demoStore) {
        console.error('❌ Không tìm thấy cửa hàng Demo. Vui lòng chạy `npm run db:seed` trước.');
        return;
    }

    const storeId = demoStore.id;
    console.log(`  🏢 Cửa hàng: ${demoStore.name} (ID: ${storeId})`);

    // 2. Tạo Danh mục
    const categoriesData = [
        { name: 'Đồ uống', description: 'Nước ngọt, bia, rượu, nước suối' },
        { name: 'Bánh kẹo', description: 'Bánh các loại, kẹo, chocolate' },
        { name: 'Thực phẩm khô', description: 'Mì gói, phở khô, bún khô, miến' },
        { name: 'Gia vị', description: 'Nước mắm, dầu ăn, bột ngọt, hạt nêm' },
        { name: 'Hóa mỹ phẩm', description: 'Dầu gội, sữa tắm, bột giặt, nước rửa chén' },
        { name: 'Sữa & Chế phẩm', description: 'Sữa tươi, sữa chua, phô mai' },
    ];

    const categories = [];
    for (const cat of categoriesData) {
        const c = await prisma.category.upsert({
            where: { storeId_name: { storeId, name: cat.name } },
            update: {},
            create: { storeId, ...cat },
        });
        categories.push(c);
    }
    console.log(`  ✅ Đã tạo ${categories.length} danh mục.`);

    // 3. Tạo Sản phẩm
    const productsData = [
        // Đồ uống
        { name: 'Coca Cola 330ml', barcode: '8935049500544', price: 10000, priceIn: 7500, unit: 'Lon', categoryIndex: 0, stock: 48, imageUrl: 'https://cdn.tgdd.vn/Products/Images/2443/76450/bhx/nuoc-ngot-coca-cola-vi-nguyen-ban-lon-320ml-202303031024357989.jpg' },
        { name: 'Pepsi 330ml', barcode: '8934588013032', price: 10000, priceIn: 7200, unit: 'Lon', categoryIndex: 0, stock: 40, imageUrl: 'https://cdn.tgdd.vn/Products/Images/2443/76467/bhx/nuoc-ngot-pepsi-cola-lon-320ml-202303251433013898.jpg' },
        { name: 'Bia Tiger Nâu 330ml', barcode: '8888005310022', price: 17000, priceIn: 14500, unit: 'Lon', categoryIndex: 0, stock: 120, imageUrl: 'https://cdn.tgdd.vn/Products/Images/2282/77665/bhx/bia-tiger-nau-lon-330ml-202306131433013898.jpg' },
        { name: 'Nước suối Aquafina 500ml', barcode: '8934588063051', price: 6000, priceIn: 3500, unit: 'Chai', categoryIndex: 0, stock: 24, imageUrl: 'https://cdn.tgdd.vn/Products/Images/2563/76531/bhx/nuoc-tinh-khiet-aquafina-500ml-202303031024357989.jpg' },

        // Bánh kẹo
        { name: 'Bánh Chocopie Hộp 12 cái', barcode: '8801117945517', price: 55000, priceIn: 42000, unit: 'Hộp', categoryIndex: 1, stock: 15, imageUrl: 'https://cdn.tgdd.vn/Products/Images/3364/79658/bhx/banh-choco-pie-orion-hop-12-cai-x-33g-202303031024357989.jpg' },
        { name: 'Kẹo Singum Cool Air Hũ', barcode: '8935001700234', price: 25000, priceIn: 18000, unit: 'Hũ', categoryIndex: 1, stock: 10, imageUrl: 'https://cdn.tgdd.vn/Products/Images/3364/79658/bhx/banh-choco-pie-orion-hop-12-cai-x-33g-202303031024357989.jpg' },

        // Thực phẩm khô
        { name: 'Mì Hảo Hảo Tôm Chua Cay', barcode: '8934563138164', price: 4500, priceIn: 3200, unit: 'Gói', categoryIndex: 2, stock: 200, imageUrl: 'https://cdn.tgdd.vn/Products/Images/2565/76798/bhx/mi-hao-hao-tom-chua-cay-goi-75g-202303031024357989.jpg' },
        { name: 'Phở bò Vifon', barcode: '8934561230123', price: 7000, priceIn: 5500, unit: 'Gói', categoryIndex: 2, stock: 50, imageUrl: '' },

        // Gia vị
        { name: 'Dầu ăn Simply 1L', barcode: '8934988010015', price: 55000, priceIn: 48000, unit: 'Chai', categoryIndex: 3, stock: 12, imageUrl: '' },
        { name: 'Nước mắm Nam Ngư 750ml', barcode: '8935001700234', price: 38000, priceIn: 32000, unit: 'Chai', categoryIndex: 3, stock: 18, imageUrl: '' },

        // Hóa mỹ phẩm
        { name: 'Dầu gội Clear Men 650g', barcode: '8934868120034', price: 165000, priceIn: 135000, unit: 'Chai', categoryIndex: 4, stock: 5, imageUrl: '' },
        { name: 'Bột giặt OMO Matic 3.6kg', barcode: '8934868130056', price: 185000, priceIn: 155000, unit: 'Túi', categoryIndex: 4, stock: 8, imageUrl: '' },
    ];

    let prodCount = 0;
    for (const p of productsData) {
        let existing = null;
        if (p.barcode) {
            existing = await prisma.product.findFirst({ where: { storeId, barcode: p.barcode } });
        }

        if (!existing) {
            await prisma.product.create({
                data: {
                    storeId,
                    name: p.name,
                    barcode: p.barcode,
                    price: p.price,
                    priceIn: p.priceIn,
                    unit: p.unit,
                    currentStock: p.stock,
                    imageUrl: p.imageUrl,
                    categoryId: categories[p.categoryIndex].id,
                }
            });
            prodCount++;
        }
    }
    console.log(`  ✅ Đã thêm ${prodCount} sản phẩm.`);

    // 4. Tạo Khách hàng
    const customersData = [
        { name: 'Khách lẻ', phone: null, address: '' },
        { name: 'Nguyễn Văn A', phone: '0909123456', address: '123 Lê Lợi' },
        { name: 'Trần Thị B', phone: '0918123456', address: '456 Nguyễn Huệ' },
        { name: 'Lê Văn C', phone: '0903123456', address: '789 Hai Bà Trưng' },
    ];

    for (const c of customersData) {
        // Fix: phone can be unique or not, careful with findFirst
        const existing = await prisma.customer.findFirst({ where: { storeId, name: c.name, phone: c.phone } });
        if (!existing) {
            await prisma.customer.create({ data: { storeId, ...c } });
        }
    }
    console.log(`  ✅ Đã thêm khách hàng mẫu.`);

    console.log('\n🎉 Hoàn thành nạp dữ liệu Demo!');
}

seedData()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
