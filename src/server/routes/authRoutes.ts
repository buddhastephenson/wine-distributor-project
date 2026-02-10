import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/signup', AuthController.signup.bind(AuthController)); // Ensure context is bound if not using arrow functions in class, or just bind here
router.post('/login', AuthController.login.bind(AuthController));
router.get('/verify', authenticate, AuthController.verify.bind(AuthController));
router.post('/forgot-password', (req, res) => AuthController.forgotPassword(req, res));
router.post('/reset-password', (req, res) => AuthController.resetPassword(req, res));
router.patch('/users/:id/password', authenticate, AuthController.updatePassword.bind(AuthController));


export default router;
