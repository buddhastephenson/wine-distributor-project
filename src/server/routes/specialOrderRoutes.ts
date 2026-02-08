import { Router } from 'express';
import SpecialOrderController from '../controllers/SpecialOrderController';

const router = Router();

// GET /api/special-orders (optional ?username=...)
router.get('/', SpecialOrderController.getAllSpecialOrders.bind(SpecialOrderController));

// POST /api/special-orders
router.post('/', SpecialOrderController.createSpecialOrder.bind(SpecialOrderController));

// PATCH /api/special-orders/:id
router.patch('/:id', SpecialOrderController.updateSpecialOrder.bind(SpecialOrderController));

// DELETE /api/special-orders/:id
router.delete('/:id', SpecialOrderController.deleteSpecialOrder.bind(SpecialOrderController));

export default router;
