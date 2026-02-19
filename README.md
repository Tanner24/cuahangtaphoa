# EPOS Pro - Hệ Thống Quản Lý Bán Hàng Hiện Đại 🚀

EPOS Pro là giải pháp quản lý bán hàng toàn diện dành cho các cửa hàng tạp hóa, siêu thị mini, và chuỗi bán lẻ. Hệ thống được xây dựng với công nghệ hiện đại, giao diện thân thiện và tối ưu hóa cho trải nghiệm người dùng trên mọi thiết bị.

## 🌟 Tính Năng Nổi Bật

### 🛒 POS Client (Dành cho Cửa Hàng)
- **Bán Hàng & Thu Ngân**: Giao diện bán hàng nhanh chóng, hỗ trợ tìm kiếm, quét mã vạch, và thanh toán đa phương thức.
- **Quản Lý Kho Hàng**: Theo dõi tồn kho thời gian thực, cảnh báo hàng sắp hết, nhập hàng và kiểm kho dễ dàng.
- **Báo Cáo Doanh Thu**: Biểu đồ trực quan về doanh thu, lợi nhuận, và các mặt hàng bán chạy nhất theo ngày, tuần, tháng.
- **Khôi Phục Mật Khẩu Tự Động**: Tính năng quên mật khẩu an toàn, tự động reset và tạo ticket hỗ trợ.
- **Hướng Dẫn Sử Dụng Tích Hợp**: Modal hướng dẫn chi tiết ngay trong ứng dụng giúp nhân viên làm quen nhanh chóng.
- **Kết Nối Thiết Bị Ngoại Vi**: Hỗ trợ máy in hóa đơn, máy quét mã vạch qua USB/LAN/Bluetooth.

### 🛠 Admin Dashboard (Dành cho Quản Trị Hệ Thống)
- **Quản Lý Cửa Hàng**: Theo dõi danh sách cửa hàng, trạng thái hoạt động, và gói dịch vụ.
- **Hệ Thống Vé Hỗ Trợ (Support Ticket)**: Tiếp nhận và xử lý yêu cầu hỗ trợ từ các cửa hàng một cách chuyên nghiệp.
- **Quản Lý Gói Dịch Vụ (Plans)**: Thiết lập và quản lý các gói đăng ký cho khách hàng.
- **Báo Cáo Hệ Thống**: Xem tổng quan về hiệu suất và hoạt động của toàn bộ hệ thống.

### 🔐 Backend API
- **Bảo Mật Cao**: Xác thực JWT, mã hóa mật khẩu với Bcrypt.
- **Hiệu Suất Ổn Định**: Xây dựng trên nền tảng Node.js & Express với kiến trúc module hóa.
- **Cơ Sở Dữ Liệu Mạnh Mẽ**: Sử dụng Prisma ORM kết nối với MySQL đảm bảo tính toàn vẹn dữ liệu.

## 🛠 Công Nghệ Sử Dụng

- **Frontend**: React.js, Vite, Tailwind CSS, Lucide React, Headless UI.
- **Backend**: Node.js, Express, TypeScript.
- **Database & ORM**: MySQL, Prisma.
- **Công Cụ Khác**: Axios, React Query, React Hook Form, Zod.

## 🚀 Cài Đặt & Chạy Ứng Dụng

### 1. Yêu Cầu Hệ Thống
- **Node.js**: Phiên bản 18 trở lên.
- **MySQL**: Phiên bản 8.0 trở lên.
- **Git**: Để quản lý mã nguồn.

### 2. Cài Đặt Backend
1. Di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Cấu hình biến môi trường:
   - Tạo file `.env` từ `.env.example`.
   - Cập nhật thông tin kết nối MySQL (`DATABASE_URL`).
4. Chạy migration và seed dữ liệu:
   ```bash
   npx prisma migrate dev
   npm run seed
   ```
5. Khởi động server:
   ```bash
   npm run dev
   ```

### 3. Cài Đặt POS Client
1. Di chuyển vào thư mục `pos-client`:
   ```bash
   cd pos-client
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi động ứng dụng:
   ```bash
   npm run dev
   ```
   truy cập tại `http://localhost:5173`

### 4. Cài Đặt Admin Dashboard
1. Di chuyển vào thư mục `admin-dashboard`:
   ```bash
   cd admin-dashboard
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi động ứng dụng:
   ```bash
   npm run dev
   ```
   truy cập tại `http://localhost:5174`

## 🤝 Đóng Góp
Mọi đóng góp đều được hoan nghênh! Vui lòng tạo Pull Request hoặc gửi Issue nếu bạn tìm thấy lỗi hoặc muốn đề xuất tính năng mới.

## 📄 Bản Quyền
Dự án thuộc sở hữu của **Tiền Hải Agency**.
