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
}

export default new AuthController();
