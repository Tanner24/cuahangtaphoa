import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';

// Helper: Generate Tokens
const generateTokens = (user: any) => {
    const accessToken = jwt.sign(
        { userId: user.id, storeId: user.storeId, role: user.role },
        JWT_SECRET,
        { expiresIn: '1d' } // POS Token lifetime longer
    );
    const refreshToken = jwt.sign(
        { userId: user.id },
        REFRESH_SECRET,
        { expiresIn: '7d' }
    );
    return { accessToken, refreshToken };
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password } = req.body;

        const user = await prisma.user.findFirst({
            where: { username },
            include: { store: true }
        });

        if (!user || user.passwordHash === 'PLACEHOLDER') { // Check valid user
            res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
            return;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
            return;
        }

        if (!user.isActive) {
            res.status(403).json({ error: 'Tài khoản đã bị khóa' });
            return;
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        const tokens = generateTokens(user);

        res.json({
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

export const registerStore = async (req: Request, res: Response): Promise<void> => {
    try {
        const { storeName, phone, fullName, password, address } = req.body;

        // Validation
        if (!storeName || !phone || !password || !fullName) {
            res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
            return;
        }

        // Check existing phone (store)
        const existingStore = await prisma.store.findUnique({ where: { phone } });
        if (existingStore) {
            res.status(400).json({ error: 'Số điện thoại này đã được đăng ký cửa hàng' });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // Transaction: Create Store -> Create User -> Create Default Plan (if logic needed)
        // Here we assign default 'Basic' plan if exists, or null
        const basicPlan = await prisma.subscriptionPlan.findUnique({ where: { name: 'Basic' } });

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Store
            const store = await tx.store.create({
                data: {
                    name: storeName,
                    phone: phone,
                    address: address || '',
                    subscriptionPlanId: basicPlan?.id
                } as any
            });

            // 2. Create Admin User for Store (Username = Phone for simplicity, or allow custom username)
            // Let's use Phone as default admin username
            const user = await tx.user.create({
                data: {
                    username: phone, // Username is phone number
                    passwordHash,
                    fullName,
                    role: 'admin',
                    storeId: store.id
                }
            });

            return { store, user };
        });

        const tokens = generateTokens(result.user);

        res.status(201).json({
            message: 'Đăng ký thành công',
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

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Lỗi server đăng ký: ' + (error as any).message });
    }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        res.status(401).json({ error: 'Thiếu Refresh Token' });
        return;
    }

    try {
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as any;
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

        if (!user) {
            res.status(403).json({ error: 'User không tồn tại' });
            return;
        }

        const tokens = generateTokens(user);
        res.json(tokens);
    } catch (error) {
        res.status(403).json({ error: 'Refresh Token không hợp lệ' });
    }
};
