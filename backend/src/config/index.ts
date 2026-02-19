import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    jwt: {
        secret: process.env.JWT_SECRET || 'fallback-secret',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    admin: {
        defaultEmail: process.env.ADMIN_DEFAULT_EMAIL || 'admin@pos-saas.com',
        defaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123456',
    },
};
