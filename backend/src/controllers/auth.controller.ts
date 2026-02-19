import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';

const prisma = new PrismaClient();

// Helper: Generate Tokens
const generateTokens = (user: any) => {
    const accessToken = jwt.sign(
        {
            userId: user.id,
            storeId: user.storeId,
            role: user.role,
            username: user.username
        },
        config.jwt.secret as string,
        { expiresIn: config.jwt.expiresIn as any }
    );

    // Refresh token expiry should be parsed or defaulted
    const refreshExpiry = config.jwt.refreshExpiresIn || '7d';

    const refreshToken = jwt.sign(
        { userId: user.id },
        config.jwt.refreshSecret as string,
        { expiresIn: refreshExpiry as any }
    );
    return { accessToken, refreshToken };
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password } = req.body;

        // 1. Tìm user theo username 
        // Lưu ý: Username trong hệ thống này nên là Unique toàn cục (ví dụ SĐT) 
        // Hoặc client phải gửi kèm storeCode. Hiện tại giả định username (SĐT) là unique.
        const user = await prisma.user.findFirst({
            where: { username }, // Tìm theo username/SĐT
            include: { store: true }
        });

        if (!user) {
            res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
            return;
        }

        // 2. Kiểm tra mật khẩu
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
            return;
        }

        // 3. Kiểm tra trạng thái User và Store
        if (!user.isActive) {
            res.status(403).json({ error: 'Tài khoản đã bị khóa' });
            return;
        }

        if (user.store && user.store.status === 'suspended') {
            res.status(403).json({ error: 'Cửa hàng của bạn đã bị tạm khóa. Vui lòng liên hệ Admin.' });
            return;
        }

        // 4. Update last login
        await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

        // 5. Generate Token
        const tokens = generateTokens(user);

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                storeId: user.storeId,
                storeName: user.store?.name
            },
            ...tokens
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        // Form đăng ký: Tên shop, SĐT (làm username), Họ tên, Mật khẩu
        const { storeName, phone, fullName, password } = req.body;

        if (!storeName || !phone || !password || !fullName) {
            res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
            return;
        }

        // 1. Kiểm tra SĐT đã tồn tại chưa (User username)
        const existingUser = await prisma.user.findFirst({ where: { username: phone } });
        if (existingUser) {
            res.status(400).json({ error: 'Số điện thoại này đã được sử dụng' });
            return;
        }

        // 2. Tìm gói Free mặc định
        const freePlan = await prisma.subscriptionPlan.findFirst({ where: { name: 'Free' } });

        const passwordHash = await bcrypt.hash(password, 10);

        // 3. Transaction tạo Store + Owner
        const result = await prisma.$transaction(async (tx) => {
            // Tạo Store
            const store = await tx.store.create({
                data: {
                    name: storeName,
                    phone: phone, // SĐT cửa hàng = SĐT chủ
                    ownerName: fullName,
                    status: 'active',
                    subscriptionPlanId: freePlan?.id,
                    subscriptionExpiredAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Tặng 1 năm
                }
            });

            // Tạo User Owner
            const user = await tx.user.create({
                data: {
                    username: phone, // Username là SĐT
                    passwordHash,
                    fullName,
                    role: 'owner',
                    storeId: store.id
                }
            });

            return { store, user };
        });

        // 4. Tự động login luôn
        const tokens = generateTokens(result.user);

        res.status(201).json({
            success: true,
            message: 'Đăng ký cửa hàng thành công',
            user: {
                id: result.user.id,
                username: result.user.username,
                fullName: result.user.fullName,
                role: result.user.role,
                storeId: result.user.storeId,
                storeName: result.store.name
            },
            ...tokens
        });

    } catch (error: any) {
        console.error('Register error:', error);
        // TRẢ VỀ LỖI CHI TIẾT ĐỂ DEBUG (CHỈ DÙNG KHI DEV/DEBUG)
        res.status(500).json({
            error: 'Lỗi đăng ký (Debug)',
            message: error.message,
            stack: error.stack,
            code: error.code,
            meta: error.meta
        });
    }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    // Implement refresh logic if needed
    res.status(501).json({ error: 'Not implemented yet' });
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Chưa đăng nhập' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { store: true }
        });

        if (!user) {
            res.status(404).json({ error: 'Không tìm thấy người dùng' });
            return;
        }

        res.json({
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            storeId: user.storeId,
            storeName: user.store?.name
        });
    } catch (error) {
        console.error('Get Me error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};
