import { Router } from 'express';
import UserController from '../controllers/UserController';

const router = Router();

// GET /api/auth/users
router.get('/', UserController.getAllUsers.bind(UserController));

// POST /api/auth/users/quick-create
router.post('/quick-create', UserController.quickCreate.bind(UserController));

// PATCH /api/auth/users/:id/access
router.patch('/:id/access', UserController.toggleAccess.bind(UserController));

// PATCH /api/auth/users/:id/role
router.patch('/:id/role', UserController.updateUserRole.bind(UserController));

// PATCH /api/auth/users/:id/username
router.patch('/:id/username', UserController.updateUsername.bind(UserController));

// PATCH /api/auth/users/:id/password
router.patch('/:id/password', UserController.updatePassword.bind(UserController));

// DELETE /api/auth/users/:id
router.delete('/:id', UserController.deleteUser.bind(UserController));

export default router;
