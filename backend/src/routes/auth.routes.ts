import express from 'express';
import { login, refreshToken, register } from '../controllers/auth.controller';

const router = express.Router();

router.post('/login', login);
router.post('/register', register); // Add Register Route
router.post('/refresh-token', refreshToken);
router.post('/logout', (req, res) => {
    // Client clears token. Server can blacklist refresh token if implemented
    res.json({ message: 'Logged out' });
});

export default router;
