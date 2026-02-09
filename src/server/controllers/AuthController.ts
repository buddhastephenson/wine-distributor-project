import { Request, Response } from 'express';
import AuthService from '../services/AuthService';

class AuthController {
    async signup(req: Request, res: Response) {
        try {
            const result = await AuthService.signup(req.body);
            if (!result.success) {
                const status = result.error?.includes('revoked') ? 403 : 400;
                return res.status(status).json(result);
            }
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async verify(req: Request, res: Response) {
        try {
            // req.user is attached by authenticate middleware
            const user = req.user;
            if (!user) {
                return res.status(401).json({ success: false, error: 'Not Authenticated' });
            }
            console.log('Verify Endpoint User:', { username: user.username, vendors: user.vendors });
            res.json({ success: true, user });
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async quickCreate(req: Request, res: Response) {
        try {
            const { username } = req.body;
            const result = await AuthService.quickCreateCustomer(username);
            if (!result.success) {
                return res.status(400).json(result);
            }
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async login(req: Request, res: Response) {
        try {
            const result = await AuthService.login(req.body);
            if (!result.success) {
                const status = result.error?.includes('Revoked') ? 403 : 401;
                return res.status(status).json(result);
            }
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    async forgotPassword(req: Request, res: Response) {
        try {
            const result = await AuthService.forgotPassword(req.body.email);
            // Always return success to prevent user enumeration (service layer logic)
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async resetPassword(req: Request, res: Response) {
        try {
            const { token, password } = req.body;
            const result = await AuthService.resetPassword(token, password);
            if (!result.success) {
                return res.status(400).json(result);
            }
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async updatePassword(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { password } = req.body;

            // Basic validation
            if (!password || password.length < 6) {
                return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
            }

            const result = await AuthService.updatePassword(id as string, password);
            if (!result.success) {
                return res.status(400).json(result);
            }
            res.json(result);
        } catch (error) {
            console.error('Update password error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

export default new AuthController();
