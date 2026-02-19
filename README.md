# Tạp Hóa Minh Anh - Quản Lý Cửa Hàng

Ứng dụng quản lý cửa hàng tạp hóa hiện đại, được xây dựng dựa trên thiết kế Figma với giao diện thân thiện mobile-first.

## Tính Năng Chính
- **Dashboard Tổng Quan**: Xem doanh thu, lợi nhuận, đơn hàng trong ngày với biểu đồ trực quan.
- **Bán Hàng POS (`sale.php`)**: Giao diện bán hàng nhanh, tìm kiếm sản phẩm, lọc theo danh mục, thêm vào giỏ.
- **Thanh Toán (`payment.php`, `qr_payment.php`)**: Hỗ trợ tính tiền thừa tự động và thanh toán qua mã QR.
- **Hóa Đơn (`receipt.php`)**: In hóa đơn chi tiết sau khi thanh toán thành công.
- **Quản Lý Kho (`inventory.php`, `stock_in.php`)**: Theo dõi tồn kho, cảnh báo hàng sắp hết, nhập hàng thêm.
- **Lịch Sử Đơn Hàng (`order_history.php`)**: Xem lại các đơn hàng đã bán.
- **Cài Đặt (`staff.php`)**: Quản lý thông tin cửa hàng và nhân viên.

## Cài Đặt & Chạy Ứng Dụng

### 1. Yêu Cầu
- **PHP** (phiên bản 7.4 trở lên)
- **MySQL** (hoặc MariaDB)
- Trình duyệt web hiện đại (Chrome, Edge, Safari)

### 2. Thiết Lập Cơ Sở Dữ Liệu
1. Mở phpMyAdmin hoặc công cụ quản lý MySQL.
2. Tạo database tên là `grocery_store`.
3. Import file `schema.sql` vào database này để tạo bảng và dữ liệu mẫu.

### 3. Cấu Hình Kết Nối
Mở các file `.php` (như `index.php`, `sale.php`...) và kiểm tra thông tin kết nối ở đầu file nếu bạn dùng mật khẩu khác cho MySQL:
```php
$host = 'localhost';
$dbname = 'grocery_store'; 
$username = 'root'; // Tên đăng nhập MySQL
$password = ''; // Mật khẩu MySQL
```

### 4. Chạy Ứng Dụng
Sử dụng PHP built-in server để chạy nhanh:
1. Mở terminal tại thư mục dự án.
2. Chạy lệnh:
   ```bash
   php -S localhost:8000
   ```
3. Truy cập trình duyệt tại địa chỉ: `http://localhost:8000`

## Công Nghệ Sử Dụng
- **Frontend**: HTML5, Tailwind CSS (qua CDN), Google Fonts (Inter), Material Icons.
- **Backend**: Native PHP.
- **Database**: MySQL.
