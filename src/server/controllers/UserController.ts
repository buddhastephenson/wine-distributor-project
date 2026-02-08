import { Request, Response } from 'express';
import UserService from '../services/UserService';

class UserController {
    async getAllUsers(req: Request, res: Response) {
        try {
            const users = await UserService.getAllUsers();
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    }

    async updateUserRole(req: Request, res: Response) {
        const { id } = req.params;
        const { type } = req.body;

        if (type !== 'admin' && type !== 'customer') {
            return res.status(400).json({ error: 'Invalid role type' });
        }

        try {
            const user = await UserService.updateUserRole(id as string, type);
            if (!user) return res.status(404).json({ error: 'User not found' });
            res.json({ success: true, user });
        } catch (error) {
            res.status(500).json({ error: 'Update failed' });
        }
    }

    async toggleAccess(req: Request, res: Response) {
        const { id } = req.params;
        const { accessRevoked } = req.body;

        try {
            const user = await UserService.toggleAccess(id as string, !!accessRevoked);
            if (!user) return res.status(404).json({ error: 'User not found' });
            res.json({ success: true, user });
        } catch (error: any) {
            if (error.message.includes('primary administrator')) {
                return res.status(403).json({ error: error.message });
            }
            res.status(500).json({ error: 'Update failed' });
        }
    }

    async updateUsername(req: Request, res: Response) {
        const { id } = req.params;
        const { username } = req.body;

        if (!username) return res.status(400).json({ error: 'Username is required' });

        try {
            const user = await UserService.updateUsername(id as string, username);
            if (!user) return res.status(404).json({ error: 'User not found' });
            res.json({ success: true, user });
        } catch (error: any) {
            if (error.message === 'Username already exists') {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Update failed' });
        }
    }

    async updatePassword(req: Request, res: Response) {
        const { id } = req.params;
        const { password } = req.body;

        if (!password) return res.status(400).json({ error: 'Password is required' });

        try {
            const user = await UserService.updatePassword(id as string, password);
            if (!user) return res.status(404).json({ error: 'User not found' });
            res.json({ success: true, message: 'Password updated successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Update failed' });
        }
    }

    async deleteUser(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const success = await UserService.deleteUser(id as string); // Explicit check or let it error if array?
            if (!success) {
                // If false returned but no error thrown, likely user not found. 
                // But UserService checks existence first. 
                // Using 404 if not found (although delete logic in service handles check)
                // Actually UserService returns false if not found.
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ success: true, message: 'User deleted successfully' });
        } catch (error: any) {
            if (error.message.includes('primary administrator')) {
                return res.status(403).json({ error: error.message });
            }
            res.status(500).json({ error: 'Delete failed' });
        }
    }
}

export default new UserController();
