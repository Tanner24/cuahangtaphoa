import { Request, Response } from 'express';
import prisma from '../config/database';

export const getLatestAnnouncement = async (req: Request, res: Response) => {
    try {
        const announcement = await prisma.announcement.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(announcement);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi lấy thông báo' });
    }
};

export const createAnnouncement = async (req: Request, res: Response) => {
    try {
        const { title, content, type } = req.body;

        // Deactivate old announcements (optional, or keep multiple)
        // For simplicity, we can have multiple active ones if we want, 
        // but the request "displays announcement" usually means the latest one.

        const announcement = await prisma.announcement.create({
            data: { title, content, type }
        });
        res.status(201).json(announcement);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi tạo thông báo' });
    }
};

export const getAnnouncements = async (req: Request, res: Response) => {
    try {
        const announcements = await prisma.announcement.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi lấy danh sách thông báo' });
    }
};
