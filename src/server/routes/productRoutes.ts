import { Router } from 'express';
import ProductController from '../controllers/ProductController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply middleware to all routes
router.use(authenticate);

// GET /api/products
router.get('/', ProductController.getAllProducts.bind(ProductController));

// POST /api/products
router.post('/', ProductController.createProduct.bind(ProductController));

// PATCH /api/products/:id
router.patch('/:id', ProductController.updateProduct.bind(ProductController));

// DELETE /api/products/:id
router.delete('/:id', ProductController.deleteProduct.bind(ProductController));

// POST /api/products/import
router.post('/import', ProductController.importProducts.bind(ProductController));

// POST /api/products/deduplicate/scan
router.get('/deduplicate/scan', ProductController.deduplicateScan.bind(ProductController));

// POST /api/products/deduplicate/execute
router.post('/deduplicate/execute', ProductController.deduplicateExecute.bind(ProductController));

// --- Supplier Management Routes ---

// GET /api/products/suppliers/stats
router.get('/suppliers/stats', ProductController.getSuppliers.bind(ProductController));

// POST /api/products/suppliers/rename
router.post('/suppliers/rename', ProductController.renameSupplier.bind(ProductController));

// DELETE /api/products/suppliers/:name
router.delete('/suppliers/:name', ProductController.deleteSupplier.bind(ProductController));

export default router;
