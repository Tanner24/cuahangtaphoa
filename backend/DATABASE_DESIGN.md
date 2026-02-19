# Thiết Kế Cơ Sở Dữ Liệu POS Hiệu Năng Cao

Tài liệu này mô tả kiến trúc cơ sở dữ liệu PostgreSQL tối ưu hóa cho hệ thống POS với khả năng xử lý hàng chục nghìn mã hàng và truy xuất <10ms.

## 1. Kiến Trúc Tổng Quan

Chúng tôi sử dụng **PostgreSQL** với sức mạnh của các Index chuyên dụng:
- **UUID (`uuid-ossp`)**: Chuẩn hóa khóa chính, hỗ trợ phân tán và merge data dễ dàng.
- **B-Tree Index**: Tối ưu hóa tuyệt đối cho tra cứu chính xác (Exact Match) như Barcode.
- **GIN Index (`pg_trgm`)**: Tối ưu hóa cho tìm kiếm mờ (Fuzzy Search), tìm kiếm chuỗi con (Substring) cho Tên sản phẩm.

## 2. Cấu Trúc Bảng (Schema Design)

### Bảng `categories` (Danh mục)
| Column | Type | Index | Mô tả |
|--------|------|-------|-------|
| `id` | UUID | PK | Khóa chính |
| `name` | VARCHAR(100) | | Tên danh mục (VD: Đồ uống) |
| `slug` | VARCHAR(100) | UNIQUE | URL friendly (VD: do-uong) |

### Bảng `products` (Sản phẩm - Core)
| Column | Type | Index | Mô tả |
|--------|------|-------|-------|
| `id` | UUID | PK | Khóa chính |
| `barcode` | VARCHAR(50) | **B-Tree (Unique)** | Mã vạch (Quét <1ms) |
| `name` | TEXT | **GIN (trgm_ops)** | Tên sp (Tìm kiếm <10ms) |
| `unit` | VARCHAR(20) | | Đơn vị: Thùng, Gói, Lon |
| `cost_price` | DECIMAL(15,2) | | Giá vốn |
| `retail_price` | DECIMAL(15,2) | | Giá bán lẻ |
| `category_id` | UUID | FK | Liên kết danh mục |
| `current_stock` | INT | | Tồn kho tổng (Cached) |

### Bảng `inventory` (Kho hàng chi tiết - Batch Management)
Lưu trữ chi tiết từng lô hàng, hạn sử dụng.
| Column | Type | Index | Mô tả |
|--------|------|-------|-------|
| `id` | UUID | PK | Khóa chính |
| `product_id` | UUID | FK | Liên kết sản phẩm |
| `batch_code` | VARCHAR(50) | | Mã lô hàng |
| `quantity` | INT | | Số lượng trong lô |
| `expiry_date` | TIMESTAMP | **B-Tree** | Hạn sử dụng (Alert) |
| `location` | VARCHAR(50) | | Vị trí kho (Kệ A1) |

## 3. Chiến Lược Index (Performance Tuning)

### 3.1. Truy vấn Barcode (Scanner)
Sử dụng **B-Tree Index** mặc định của PostgreSQL. Đây là cấu trúc dữ liệu nhanh nhất cho các truy vấn so sánh bằng (`=`).
```sql
CREATE UNIQUE INDEX idx_products_barcode ON products(barcode);
```
**Tốc độ:** O(log N). Với 1 triệu bản ghi, chỉ mất vài thao tác I/O.

### 3.2. Tìm kiếm Tên (Fuzzy Search)
Sử dụng **GIN Index** với `pg_trgm` (Telegram/Trigram). Extension này chia nhỏ chuỗi thành các bộ 3 ký tự để đánh index, cho phép tìm kiếm `LIKE '%keyword%'` cực nhanh mà B-Tree không làm được.
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
```

### 3.3. Tích hợp Open Food Facts (OFF)
Hệ thống sử dụng API từ [Open Food Facts](https://world.openfoodfacts.org/) để tự động hóa việc nhập liệu hàng hóa:
- **Backend Service**: `OFFService` thực hiện proxy các yêu cầu từ máy quét.
- **Data Normalization**: Tự động chuyển đổi dữ liệu từ OFF (tên sp, nhãn hiệu, ảnh, đơn vị) sang định dạng chuẩn của hệ thống POS.
- **Optimized UI**: Người dùng chỉ cần quét mã, hệ thống sẽ tự điền 80% thông tin sản phẩm.

## 4. Các Câu Lệnh SQL Mẫu (Query Patterns)

### 4.1. Quét Mã Vạch (Scanner)
Dùng cho máy quét, yêu cầu độ trễ thấp nhất.
```sql
-- Input: '8934563138164'
SELECT id, name, retail_price, unit 
FROM products 
WHERE barcode = '8934563138164' 
LIMIT 1;
```

### 4.2. Tìm Kiếm Nhanh (Search Box)
Tìm kiếm khi khách hỏi "Mì Hảo Hảo" hoặc gõ không dấu "hao hao".
```sql
-- Input: 'hao hao'
SELECT id, name, retail_price, barcode, similarity(name, 'hao hao') as score
FROM products
WHERE name % 'hao hao' -- Toán tử % của pg_trgm (vượt ngưỡng similarity)
   OR name ILIKE '%hao hao%'
ORDER BY score DESC
LIMIT 10;
```

## 5. Dữ Liệu Mẫu (Seed Data)

```sql
INSERT INTO categories (id, name, slug) VALUES 
(gen_random_uuid(), 'Sữa các loại', 'sua-cac-loai'),
(gen_random_uuid(), 'Đồ uống có cồn', 'do-uong-co-con'),
(gen_random_uuid(), 'Thực phẩm ăn liền', 'thuc-pham-an-lien');

-- Sản phẩm mẫu
INSERT INTO products (id, barcode, name, unit, cost_price, retail_price, category_id) VALUES
(gen_random_uuid(), '8934563138164', 'Mì Hảo Hảo Tôm Chua Cay 75g', 'Gói', 3200, 4500, (SELECT id FROM categories WHERE slug='thuc-pham-an-lien')),
(gen_random_uuid(), '8930001234567', 'Sữa đặc Cô gái Hà Lan 380g', 'Lon', 18000, 24000, (SELECT id FROM categories WHERE slug='sua-cac-loai')),
(gen_random_uuid(), '8888005310022', 'Bia Tiger Crystal 330ml', 'Lon', 14500, 17000, (SELECT id FROM categories WHERE slug='do-uong-co-con'));
```
