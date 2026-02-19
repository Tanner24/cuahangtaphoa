import { Request } from 'express';

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: number;
                storeId: number;
                role: string;
                username?: string;
                fullName?: string;
                storeName?: string;
            }
        }
    }
}
