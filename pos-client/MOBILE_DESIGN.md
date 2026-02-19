# Hướng Dẫn Thiết Kế & Phát Triển UI Mobile App (EPOS Pro)

Tài liệu này định hướng quy chuẩn thiết kế và phát triển giao diện (UI/UX) cho phiên bản ứng dụng di động của EPOS Pro. Đích đến là tạo ra trải nghiệm người dùng mượt mà, chuyên nghiệp và tối ưu cho thao tác chạm.

## 📱 1. Nguyên Tắc Thiết Kế (Core Principles)

- **Mobile First**: Ưu tiên hiển thị thông tin quan trọng nhất. Không nhồi nhét mọi thứ từ web vào mobile.
- **Thumb Zone Friendly**: Các nút bấm quan trọng (Thanh toán, Thêm đơn, Menu) phải nằm trong vùng ngón cái dễ chạm tới (phía dưới màn hình).
- **Tối Giản & Rõ Ràng**: Sử dụng khoảng trắng hợp lý, font chữ dễ đọc (San Francisco/Inter), contrast cao.
- **Phản Hồi Tức Thì**: Mọi thao tác chạm phải có hiệu ứng (ripple, scale) hoặc phản hồi rung (haptic feedback).

## 🎨 2. Hệ Thống Design System Mobile

### Màu Sắc (Colors)
Giữ nguyên nhận diện thương hiệu nhưng tối ưu cho màn hình nhỏ:
- **Primary**: `Blue-600` (#2563EB) - Nút chính, Header, Active Tab.
- **Secondary**: `Slate-900` (#0F172A) - Văn bản chính, Navigation Bar.
- **Success**: `Emerald-500` (#10B981) - Trạng thái thành công, tiền vào.
- **Danger**: `Red-500` (#EF4444) - Xóa, Cảnh báo, tiền ra.
- **Background**: `Slate-50` (#F8FAFC) - Nền app sạch sẽ.

### Typography
- **Font**: Inter hoặc San Francisco (iOS) / Roboto (Android).
- **Scale**:
  - H1 (Header): 24px/Bold
  - H2 (Section): 18px/SemiBold
  - Body: 14px/Regular
  - Caption: 12px/Medium (Màu Slate-400)

### Components (Thành Phần UI)

#### 1. Navigation Bar (Bottom Tab)
Thay vì Sidebar như Web, sử dụng Bottom Tab Bar cho 4-5 mục chính:
- **Trang chủ (Dashboard)**: Biểu đồ nhỏ, lối tắt.
- **Bán hàng (POS)**: Nút nổi bật nhất ở giữa (FAB - Floating Action Button).
- **Đơn hàng**: Lịch sử giao dịch.
- **Kho & Sản phẩm**: Quản lý danh mục.
- **Menu/Thêm**: Cài đặt, Báo cáo, Tài khoản.

#### 2. Cards (Thẻ Thông Tin)
Thay vì bảng (Table) ngang, chuyển sang dạng thẻ (Card) dọc:
- **Card Sản Phẩm**:
  - Trái: Ảnh thumb (64x64px, rounded).
  - Giữa: Tên (Bold), Mã SP (Caption).
  - Phải: Giá (Màu Primary), Tồn kho.
- **Card Đơn Hàng**:
  - Dòng 1: Mã đơn (#ORD-001) - Trạng thái (Badge).
  - Dòng 2: Tổng tiền (To, rõ).
  - Dòng 3: Khách hàng & Thời gian.

#### 3. Bottom Sheet (Ngăn Kéo Dưới)
Sử dụng Bottom Sheet thay cho Modal pop-up giữa màn hình để thao tác một tay dễ hơn:
- Chọn bộ lọc (Filter).
- Chi tiết hóa đơn.
- Form thêm nhanh sản phẩm.

## 🛠 3. Chi Tiết Các Màn Hình Quan Trọng

### 🏠 Màn Hình Dashboard
- **Header**: Xin chào, [Tên Nhân Viên] + Icon Thông báo.
- **Widgets**:
  - Tổng doanh thu hôm nay (Card màu gradient).
  - 3-4 nút tắt (Quick Actions): Bán hàng ngay, Nhập kho, Quét mã.
- **Danh sách gần đây**: 5 đơn hàng mới nhất (dạng list rút gọn).

### 🛒 Màn Hình Bán Hàng (POS) - **Trọng Tâm**
Đây là màn hình quan trọng nhất. Cần tối ưu tốc độ.
- **Thanh Tìm Kiếm**: Trên cùng kết hợp nút **Quét Barcode (Camera)**.
- **Danh Sách SP**: Grid 2 cột hoặc List (có nút +/- số lượng to).
- **Giỏ Hàng**:
  - Không hiện full list như web.
  - Hiện thanh tổng tiền dính dưới đáy (Sticky Footer).
  - Bấm vào thanh tổng tiền -> Mở Bottom Sheet chi tiết giỏ hàng để sửa/xóa.
- **Thanh Toán**: Nút "Thanh Toán" to, full-width ở dưới cùng.

### 📦 Màn Hình Quản Lý Kho
- **Bộ Lọc**: Tabs trượt ngang (Tất cả | Sắp hết | Hết hàng).
- **Thao Tác Nhanh**: Vuốt trái (Swipe left) item để Sửa/Xóa hoặc Nhập thêm hàng.
- **Fab Button**: Nút "+" góc dưới phải để thêm sản phẩm mới.

### 👤 Màn Hình Báo Cáo & Cài Đặt
- Các biểu đồ chuyển về dạng Line Chart đơn giản hoặc Pie Chart.
- List menu cài đặt dạng Settings của iOS (Icon bên trái, Tên options, Mũi tên bên phải).

## 🚀 4. Lộ Trình Triển Khai (Tech Stack Recommendation)

Để tận dụng code hiện tại, có 2 phương án:

### Phương Án A: React Native (Recommended)
- **Ưu điểm**: Trải nghiệm Native mượt mà, tận dụng logic JS hiện có.
- **UI Library**: `NativeWind` (Tailwind cho RN) hoặc `Tamagui`.
- **Icons**: `Lucide-React-Native`.

### Phương Án B: PWA (Progressive Web App) - Nhanh nhất
- Tối ưu lại CSS của project hiện tại bằng Media Queries.
- Thêm `manifest.json` và Service Worker để cài như app.
- **Lưu ý**: Cần ẩn Sidebar khi ở mobile, hiện Bottom Tab.

## 📝 5. Checklist Kiểm Tra UI Mobile
- [ ] Font size tối thiểu 12px.
- [ ] Vùng chạm (Touch target) tối thiểu 44x44px.
- [ ] Input nhập liệu phải tự động hiện bàn phím số khi nhập tiền/số lượng.
- [ ] Không có thanh cuộn ngang (trừ các carousel chủ đích).
- [ ] Dark Mode support (nếu có thể).
