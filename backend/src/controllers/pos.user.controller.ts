import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const getStoreUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const storeId = (req as any).user?.storeId;
        const currentUserRole = (req as any).user?.role;

        if (currentUserRole !== 'owner' && currentUserRole !== 'manager') {
            res.status(403).json({ error: 'Bạn không có quyền thực hiện thao tác này' });
            return;
        }

        const users = await prisma.user.findMany({
            where: { storeId },
            select: {
                id: true,
                username: true,
                fullName: true,
                role: true,
                isActive: true,
                lastLogin: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        console.error('Get store users error:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy danh sách nhân viên' });
    }
};

export const createStoreUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const storeId = (req as any).user?.storeId;
        const currentUserRole = (req as any).user?.role;

        // Chỉ owner hoặc manager mới có quyền tạo nhân viên
        if (currentUserRole !== 'owner' && currentUserRole !== 'manager') {
            res.status(403).json({ error: 'Bạn không có quyền thực hiện thao tác này' });
            return;
        }

        const { username, password, fullName, role } = req.body;

        if (!username || !password || !fullName || !role) {
            res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
            return;
        }

        // Kiểm tra username đã tồn tại chưa
        const existingUser = await prisma.user.findFirst({
            where: { username }
        });

        if (existingUser) {
            res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                storeId,
                username,
                passwordHash,
                fullName,
                role: role || 'staff',
                isActive: true
            },
            select: {
                id: true,
                username: true,
                fullName: true,
                role: true,
                isActive: true
            }
        });

        res.status(201).json(newUser);
    } catch (error) {
        console.error('Create store user error:', error);
        res.status(500).json({ error: 'Lỗi server khi tạo nhân viên' });
    }
};

export const updateStoreUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const storeId = (req as any).user?.storeId;
        const currentUserRole = (req as any).user?.role;
        const userId = parseInt(req.params.id);

        if (currentUserRole !== 'owner' && currentUserRole !== 'manager') {
            res.status(403).json({ error: 'Bạn không có quyền thực hiện thao tác này' });
            return;
        }

        const { fullName, role, isActive, password } = req.body;

        const data: any = { fullName, role, isActive };
        if (password) {
            data.passwordHash = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.updateMany({
            where: { id: userId, storeId },
            data
        });

        if (updatedUser.count === 0) {
            res.status(404).json({ error: 'Không tìm thấy nhân viên' });
            return;
        }

        res.json({ message: 'Cập nhật thành công' });
    } catch (error) {
        console.error('Update store user error:', error);
        res.status(500).json({ error: 'Lỗi server khi cập nhật nhân viên' });
    }
};

export const deleteStoreUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const storeId = (req as any).user?.storeId;
        const currentUserRole = (req as any).user?.role;
        const userId = parseInt(req.params.id);

        if (currentUserRole !== 'owner') {
            res.status(403).json({ error: 'Chỉ chủ cửa hàng mới có quyền xóa nhân viên' });
            return;
        }

        // Không cho phép tự xóa chính mình
        if (userId === (req as any).user?.userId) {
            res.status(400).json({ error: 'Bạn không thể tự xóa chính mình' });
            return;
        }

        const deleted = await prisma.user.deleteMany({
            where: { id: userId, storeId }
        });

        if (deleted.count === 0) {
            res.status(404).json({ error: 'Không tìm thấy nhân viên' });
            return;
        }

        res.json({ message: 'Đã xóa nhân viên' });
    } catch (error) {
        console.error('Delete store user error:', error);
        res.status(500).json({ error: 'Lỗi server khi xóa nhân viên' });
    }
};
