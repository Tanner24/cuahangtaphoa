import axios from 'axios';

export interface OFFProduct {
    name: string;
    barcode: string;
    brand?: string;
    unit?: string;
    imageUrl?: string;
    category?: string;
}

export class OFFService {
    private static BASE_URL = 'https://world.openfoodfacts.org/api/v0/product/';

    static async getProductByBarcode(barcode: string): Promise<OFFProduct | null> {
        try {
            const response = await axios.get(`${this.BASE_URL}${barcode}.json`, {
                headers: {
                    'User-Agent': 'Tạp Hóa POS - WebApp - Version 1.0'
                }
            });

            if (response.data.status === 1 && response.data.product) {
                const p = response.data.product;

                // Prioritize Vietnamese name
                const name = p.product_name_vi || p.product_name || p.generic_name_vi || p.generic_name || 'Sản phẩm chưa rõ tên';
                const brand = p.brands ? p.brands.split(',')[0] : '';
                const fullName = brand ? `${brand} - ${name}` : name;

                return {
                    barcode: p.code,
                    name: fullName,
                    brand: brand,
                    unit: p.quantity || p.serving_quantity_unit || 'Cái',
                    imageUrl: p.image_url || p.image_front_url || p.image_thumb_url,
                    category: p.categories_tags ? p.categories_tags[0].replace('en:', '').replace('vi:', '') : undefined
                };
            }
            return null;
        } catch (error) {
            console.error('Open Food Facts API Error:', error);
            return null;
        }
    }
}
