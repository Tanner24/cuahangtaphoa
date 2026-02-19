import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

// ============ Security Middleware ============
app.use(helmet());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors()); // Enable pre-flight for all routes

// ============ Parsers ============
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============ Root Route (Debug) ============
app.get('/', (req, res) => {
    res.json({ message: 'POS Backend is running!', timestamp: new Date() });
});

// ============ Logging ============
app.use(morgan('dev'));

// ============ Rate Limiting ============
// TODO: Implement rate limiting for login endpoint
// import rateLimit from 'express-rate-limit';
// const loginLimiter = rateLimit({ windowMs: 15*60*1000, max: 5 });

// ============ Routes ============
import posRoutes from './routes/pos.routes';

import managementRoutes from './routes/management.routes';
import webhookRoutes from './routes/webhook.routes';

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/pos', posRoutes);
app.use('/management', managementRoutes); // New Management routes
app.use('/webhooks', webhookRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: config.nodeEnv,
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint không tồn tại' });
});

// Error Handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('=== GLOBAL ERROR ===');
    console.error('URL:', req.method, req.url);
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    console.error('===================');
    res.status(500).json({ error: 'Lỗi server nội bộ', detail: err.message });
});

// ============ Start Server ============
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV !== 'production') {
    // Only listen if not running in production Vercel environment (or if explicitly needed)
    // Actually, Vercel imports this file, so we should check if we are main module.
    // However, es module check is tricky. Let's use a simple env var check or just export app.
    // Better strategy: Only listen if NOT imported.
    // unique to node: require.main === module (CommonJS) or import.meta.url === process.argv[1] (ESM)
}

// Support Vercel Serverless
const PORT = config.port || 3000;

// Only start server if not running in Vercel (Vercel handles the server via 'export default app')
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`
    ╔══════════════════════════════════════════════╗
    ║     🚀 POS SaaS Backend API Server          ║
    ║                                              ║
    ║     Port:    ${PORT}                          ║
    ║     Env:     ${config.nodeEnv.padEnd(30)}║
    ║     Time:    ${new Date().toLocaleString('vi-VN').padEnd(30)}║
    ║                                              ║
    ║     Auth:    /auth/login                     ║
    ║     Admin:   /admin/*                        ║
    ║     Health:  /health                         ║
    ╚══════════════════════════════════════════════╝
      `);
    });
}

export default app;
