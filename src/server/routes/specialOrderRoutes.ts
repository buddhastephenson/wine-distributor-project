import { Router } from 'express';
import SpecialOrderController from '../controllers/SpecialOrderController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /api/special-orders (optional ?username=...)
router.get('/', SpecialOrderController.getAllSpecialOrders.bind(SpecialOrderController));

// POST /api/special-orders
router.post('/', SpecialOrderController.createSpecialOrder.bind(SpecialOrderController));

// PATCH /api/special-orders/:id
// Batch Update (Must come before :id routes to avoid conflict if logic was different, though here 'batch-status' is distinct from ':id')
router.post('/batch-status', authenticate, SpecialOrderController.batchUpdateStatus.bind(SpecialOrderController));

router.patch('/:id', authenticate, SpecialOrderController.updateSpecialOrder.bind(SpecialOrderController));

// DELETE /api/special-orders/bulk
router.delete('/bulk', SpecialOrderController.bulkDeleteSpecialOrders.bind(SpecialOrderController));

// DELETE /api/special-orders/:id
router.delete('/:id', SpecialOrderController.deleteSpecialOrder.bind(SpecialOrderController));

export default router;
