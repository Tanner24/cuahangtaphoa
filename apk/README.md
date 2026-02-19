# EPOS Pro Mobile App

Dự án ứng dụng di động cho hệ thống EPOS Pro, được xây dựng bằng **React Native** và **Expo**.

## 🚀 Cài Đặt & Chạy Ứng Dụng

### 1. Yêu Cầu
- Node.js (v18 trở lên)
- Expo Go (trên điện thoại Android/iOS)

### 2. Cài Đặt
Di chuyển vào thư mục `apk` và cài đặt dependencies:

```bash
cd apk
npm install
```

### 3. Chạy Server Development
```bash
npx expo start
```
Quét mã QR bằng ứng dụng **Expo Go** trên điện thoại của bạn để chạy thử.

## 📱 Cấu Trúc Dự Án
```
apk/
├── assets/             # Hình ảnh, icons
├── src/
│   ├── components/     # Các thành phần UI tái sử dụng
│   ├── constants/      # Màu sắc, cấu hình chung
│   ├── screens/        # Các màn hình chính (Dashboard, POS, Orders)
│   └── navigation/     # (Tuỳ chọn) Cấu hình điều hướng
├── App.js              # Entry point & Tab Navigation
└── package.json
```

## 🛠 Công Nghệ
- **Expo SDK 50**
- **React Navigation 6**
- **Lucide React Native**
