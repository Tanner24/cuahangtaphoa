# 🛠️ Hướng dẫn Kiểm tra Deploy (Troubleshooting)

Bạn đang gặp lỗi kết nối giữa Frontend và Backend. Hãy làm theo 3 bước sau để tìm ra nguyên nhân và sửa dứt điểm.

## Bước 1: Xác định đúng Link Backend 🔗

Rất nhiều lỗi do điền nhầm Link Frontend vào biến `VITE_API_URL`.

1.  Mở trình duyệt.
2.  Truy cập vào đường link mà bạn đang nghĩ là Backend (Ví dụ: `https://cuahangtaphoa-uodn.vercel.app`).
3.  **Quan sát kết quả:**
    *   ❌ **Nếu thấy giao diện Đăng Nhập màu xanh/trắng:** -> Đây là **Frontend**. Bạn đã điền SAI link. Hãy tìm lại link của Project Backend.
    *   ✅ **Nếu thấy dòng chữ:** `{"message":"POS Backend is running!",...}` -> Đây đúng là **Backend**. Backend đang hoạt động tốt.

## Bước 2: Kiểm tra Biến Môi Trường trên Vercel ⚙️

Nếu Bước 1 đúng là Backend nhưng vẫn lỗi, có thể do Backend thiếu thông tin kết nối Database.

1.  Vào [Vercel Dashboard](https://vercel.com/dashboard).
2.  Chọn **Project Backend** (ví dụ `pos-backend`).
3.  Vào **Settings** -> **Environment Variables**.
4.  Đảm bảo bạn đã thêm đầy đủ các biến sau:
    *   `DATABASE_URL`: (Link kết nối Supabase, nhớ URL Encode mật khẩu nếu có ký tự đặc biệt)
    *   `JWT_SECRET`: (Gõ đại một chuỗi ngẫu nhiên dài dài)
    *   `JWT_REFRESH_SECRET`: (Gõ đại một chuỗi ngẫu nhiên khác)

## Bước 3: Xem Logs lỗi chi tiết 📝

Nếu cả 2 bước trên đều ổn mà vẫn lỗi, hãy xem server báo gì.

1.  Trên Vercel Project Backend, bấm vào tab **Logs**.
2.  Thử Đăng nhập lại trên Frontend.
3.  Quan sát dòng lỗi màu đỏ (Error) mới nhất xuất hiện trong Logs.
    *   Nếu thấy: `PrismaClientInitializationError` -> Sai `DATABASE_URL` hoặc Database chết.
    *   Nếu thấy: `Function Invocation Failed` -> Code bị crash lúc khởi động.

---

## 💡 Cách lấy lại `DATABASE_URL` từ Supabase
1.  Vào Supabase -> Settings -> Database -> Connection String (Nodejs).
2.  Copy chuỗi đó.
3.  Thay `[YOUR-PASSWORD]` bằng mật khẩu DB của bạn.
