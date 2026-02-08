import { Router } from 'express';
import ProductController from '../controllers/ProductController';

const router = Router();

// GET /api/products
router.get('/', ProductController.getAllProducts.bind(ProductController));

// PATCH /api/products/:id
router.patch('/:id', ProductController.updateProduct.bind(ProductController));

// DELETE /api/products/:id
router.delete('/:id', ProductController.deleteProduct.bind(ProductController));

export default router;
