import express from 'express';
import { getCategories, createCategory } from '../controllers/category.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener categorías de la tienda
router.get('/', getCategories);

// Crear nueva categoría
router.post('/', createCategory);

export default router;
