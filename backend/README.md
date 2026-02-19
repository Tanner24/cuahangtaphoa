# POS SaaS Backend API

## 📋 Yêu cầu hệ thống

- Node.js >= 18
- PostgreSQL >= 14 (hoặc dùng SQLite để dev nhanh)

## 🚀 Hướng dẫn cài đặt

### Option 1: Dùng SQLite (Nhanh - Cho dev)

```powershell
# 1. Cài dependencies
npm install

# 2. Chuyển sang SQLite (sửa trong prisma/schema.prisma)
# Thay dòng:
#   provider = "postgresql"
# Thành:
#   provider = "sqlite"
#
# Và thay DATABASE_URL trong .env:
#   DATABASE_URL="file:./dev.db"

# 3. Generate Prisma Client
npx prisma generate

# 4. Tạo database & bảng
npx prisma db push

# 5. Seed dữ liệu ban đầu (plans + admin account)
npm run db:seed

# 6. Chạy server
npm run dev
```

### Option 2: Dùng PostgreSQL (Production-ready)

```powershell
# 1. Cài PostgreSQL (nếu chưa có)
# Download: https://www.postgresql.org/download/windows/

# 2. Tạo database
psql -U postgres
CREATE DATABASE pos_saas;
\q

# 3. Cài dependencies
npm install

# 4. Kiểm tra .env xem DATABASE_URL đúng chưa:
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/pos_saas?schema=public"

# 5. Generate Prisma Client
npx prisma generate

# 6. Push schema lên database
npx prisma db push

# 7. Seed dữ liệu ban đầu
npm run db:seed

# 8. Chạy server
npm run dev
```

## 🔑 Tài khoản mặc định sau khi seed

- **Username:** `admin`
- **Password:** `Admin@123456`
- **Role:** `super_admin`

## 📡 API Endpoints

Server chạy tại: **http://localhost:3001**

- `GET /health` - Health check
- `POST /auth/login` - Đăng nhập
- `POST /auth/logout` - Đăng xuất
- `GET /admin/dashboard` - Dashboard stats
- `GET /admin/stores` - Danh sách cửa hàng
- `POST /admin/stores` - Tạo cửa hàng mới
- ... (xem file routes để biết đầy đủ)

## 🛠️ Scripts

```json
{
  "dev": "ts-node-dev --respawn src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "db:generate": "prisma generate",
  "db:push": "prisma db push",
  "db:seed": "ts-node-dev src/seed.ts",
  "db:studio": "prisma studio"
}
```

## 📝 Cấu trúc dự án

```
backend/
├── prisma/
│   └── schema.prisma      # Database schema (14 tables)
├── src/
│   ├── server.ts          # Express entry point
│   ├── seed.ts            # Database seeder
│   ├── config/            # Config & DB connection
│   ├── middleware/        # Auth, RBAC, Audit
│   ├── controllers/       # Business logic
│   ├── routes/            # API routes
│   └── cron/              # Background jobs
├── .env                   # Environment variables
└── package.json
```

## ⚠️ Troubleshooting

### Lỗi: "Can't reach database server"
→ PostgreSQL chưa chạy hoặc `DATABASE_URL` sai. Kiểm tra:
- PostgreSQL service đang chạy: `Get-Service -Name postgresql*`
- Database đã được tạo: `psql -U postgres -l`
- Password trong `.env` đúng chưa

### Lỗi: "Environment variable not found: DATABASE_URL"
→ File `.env` chưa có hoặc sai vị trí. Copy từ `.env.example`

### Lỗi: "PrismaClient is unable to be run in the browser"
→ Chưa generate Prisma Client: `npx prisma generate`

### Lỗi khi seed: "Unique constraint failed"
→ Database đã có dữ liệu. Xóa và tạo lại:
```powershell
npx prisma db push --force-reset
npm run db:seed
```
