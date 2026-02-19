import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const createTicket = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { subject, content, priority } = req.body;
        const storeIdStr = req.user?.storeId;

        if (!storeIdStr) {
            res.status(403).json({ error: 'Không xác định được cửa hàng' });
            return;
        }

        const storeId = parseInt(storeIdStr);

        if (!subject || !content) {
            res.status(400).json({ error: 'Tiêu đề và nội dung là bắt buộc' });
            return;
        }

        const ticket = await prisma.supportTicket.create({
            data: {
                storeId,
                subject,
                priority: priority || 'medium',
                messages: {
                    create: {
                        content,
                        senderId: req.user?.userId ? parseInt(req.user.userId) : null,
                        senderRole: 'user',
                        senderName: 'Cửa hàng'
                    }
                }
            }
        });

        res.status(201).json(ticket);
    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({ error: 'Lỗi tạo ticket' });
    }
};

export const getMyTickets = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const storeIdStr = req.user?.storeId;
        if (!storeIdStr) {
            res.status(401).json({ error: 'Chưa đăng nhập' });
            return;
        }
        const tickets = await prisma.supportTicket.findMany({
            where: { storeId: parseInt(storeIdStr) },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(tickets);
    } catch (error) {
        console.error('Get my tickets error:', error);
        res.status(500).json({ error: 'Lỗi lấy danh sách ticket' });
    }
};

export const getAllTickets = async (req: Request, res: Response): Promise<void> => {
    try {
        const tickets = await prisma.supportTicket.findMany({
            include: {
                store: { select: { name: true } }
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(tickets);
    } catch (error) {
        console.error('Get all tickets error:', error);
        res.status(500).json({ error: 'Lỗi lấy danh sách ticket' });
    }
};

export const getTicketDetail = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
            include: {
                messages: { orderBy: { createdAt: 'asc' } },
                store: { select: { name: true } }
            }
        });

        if (!ticket) {
            res.status(404).json({ error: 'Không tìm thấy ticket' });
            return;
        }

        // Security check for POS users
        const storeId = req.user?.storeId ? parseInt(req.user.storeId) : null;
        if (req.user?.role !== 'super_admin' && ticket.storeId !== storeId) {
            res.status(403).json({ error: 'Không có quyền truy cập ticket này' });
            return;
        }

        res.json(ticket);
    } catch (error) {
        console.error('Get ticket detail error:', error);
        res.status(500).json({ error: 'Lỗi lấy chi tiết ticket' });
    }
};

export const addMessage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const ticketId = parseInt(req.params.id);
        const { content } = req.body;

        const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
        if (!ticket) {
            res.status(404).json({ error: 'Không tìm thấy ticket' });
            return;
        }

        // Security check
        const isAdmin = req.user?.role === 'super_admin';
        const storeId = req.user?.storeId ? parseInt(req.user.storeId) : null;
        if (!isAdmin && ticket.storeId !== storeId) {
            res.status(403).json({ error: 'Không có quyền' });
            return;
        }

        const message = await prisma.ticketMessage.create({
            data: {
                ticketId,
                content,
                senderId: req.user?.userId ? parseInt(req.user.userId) : null,
                senderRole: isAdmin ? 'admin' : 'user',
                senderName: isAdmin ? 'Hỗ trợ kỹ thuật' : 'Cửa hàng'
            }
        });

        // Update ticket updatedAt and set status
        await prisma.supportTicket.update({
            where: { id: ticketId },
            data: {
                updatedAt: new Date(),
                status: isAdmin ? 'pending' : 'open'
            }
        });

        res.status(201).json(message);
    } catch (error) {
        console.error('Add message error:', error);
        res.status(500).json({ error: 'Lỗi gửi tin nhắn' });
    }
};

export const updateTicketStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        const { status } = req.body;

        const ticket = await prisma.supportTicket.update({
            where: { id },
            data: { status }
        });

        res.json(ticket);
    } catch (error) {
        console.error('Update ticket status error:', error);
        res.status(500).json({ error: 'Lỗi cập nhật trạng thái' });
    }
};
