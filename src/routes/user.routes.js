import express from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/user.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener usuarios de la tienda
router.get('/', getUsers);

// Crear nuevo usuario
router.post('/', createUser);

// Actualizar usuario
router.put('/:id', updateUser);

// Eliminar usuario
router.delete('/:id', deleteUser);

export default router;
