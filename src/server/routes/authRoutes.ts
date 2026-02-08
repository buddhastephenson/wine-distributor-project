import { Router } from 'express';
import AuthController from '../controllers/AuthController';

const router = Router();

router.post('/signup', AuthController.signup.bind(AuthController)); // Ensure context is bound if not using arrow functions in class, or just bind here
router.post('/login', AuthController.login.bind(AuthController));
// TODO: Add forgotPassword and resetPassword to AuthController if not already there,
// wait, I only added methods to AuthService, I need to add them to AuthController first!


export default router;
