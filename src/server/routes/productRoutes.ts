import { Router } from 'express';
import ProductController from '../controllers/ProductController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply middleware to all routes
router.use(authenticate);

// GET /api/products
router.get('/', ProductController.getAllProducts.bind(ProductController));

// PATCH /api/products/:id
router.patch('/:id', ProductController.updateProduct.bind(ProductController));

// DELETE /api/products/:id
router.delete('/:id', ProductController.deleteProduct.bind(ProductController));

// POST /api/products/import
router.post('/import', ProductController.importProducts.bind(ProductController));

export default router;
