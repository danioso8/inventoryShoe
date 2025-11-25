import express from 'express';
import { register, login, getProfile } from '../controllers/auth.controller.js';
import { googleAuth, googleCallback } from '../config/passport.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

// Rutas públicas
router.post('/register', register);
router.post('/login', login);

// Rutas de Google OAuth
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

// Rutas protegidas
router.get('/profile', authMiddleware, getProfile);

export default router;
