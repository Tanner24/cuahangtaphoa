import express from 'express';
import { login, refreshToken, register, getMe, forgotPassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/login', login);
router.post('/register', register); // Add Register Route
router.post('/forgot-password', forgotPassword);
router.post('/refresh-token', refreshToken);
router.get('/me', authenticate, getMe);
router.post('/logout', (req, res) => {
    // Client clears token. Server can blacklist refresh token if implemented
    res.json({ message: 'Logged out' });
});

export default router;
