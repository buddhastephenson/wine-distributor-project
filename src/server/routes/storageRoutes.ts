import { Router } from 'express';
import LegacyController from '../controllers/LegacyController';

const router = Router();

router.get('/:key', LegacyController.getStorage.bind(LegacyController));
router.post('/:key', LegacyController.postStorage.bind(LegacyController));
router.delete('/:key', LegacyController.deleteStorage.bind(LegacyController));

export default router;
