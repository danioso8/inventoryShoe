import express from 'express';
import { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../controllers/product.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

// Todas las rutas de productos requieren autenticación
router.use(authMiddleware);

// Obtener todos los productos de la tienda
router.get('/', getProducts);

// Obtener un producto específico
router.get('/:id', getProductById);

// Crear nuevo producto
router.post('/', createProduct);

// Actualizar producto
router.put('/:id', updateProduct);

// Eliminar producto
router.delete('/:id', deleteProduct);

export default router;
