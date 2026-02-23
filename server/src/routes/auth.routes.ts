import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, logout, refreshToken, getProfile } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('masterPasswordHash').notEmpty()
  ],
  register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  login
);

// Refresh token
router.post('/refresh', refreshToken);

// Logout
router.post('/logout', logout);

// Get profile
router.get('/profile', authenticateToken, getProfile);

export default router;
