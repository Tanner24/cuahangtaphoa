import { Request, Response } from 'express';
import prisma from '../config/database';

export const getSystemSettings = async (req: Request, res: Response) => {
    try {
        const settings = await prisma.systemSetting.findMany();
        const settingsMap = settings.reduce((acc: any, s) => {
            try {
                acc[s.key] = JSON.parse(s.value);
            } catch (e) {
                acc[s.key] = s.value;
            }
            return acc;
        }, {});
        res.json(settingsMap);
    } catch (error) {
        console.error('Get system settings error:', error);
        res.status(500).json({ error: 'Lỗi lấy cấu hình hệ thống' });
    }
};

export const updateSystemSetting = async (req: Request, res: Response) => {
    try {
        const { key, value } = req.body;
        if (!key) {
            res.status(400).json({ error: 'Key is required' });
            return;
        }

        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

        const setting = await prisma.systemSetting.upsert({
            where: { key },
            update: { value: stringValue },
            create: { key, value: stringValue }
        });

        res.json(setting);
    } catch (error) {
        console.error('Update system setting error:', error);
        res.status(500).json({ error: 'Lỗi cập nhật cấu hình hệ thống' });
    }
};
