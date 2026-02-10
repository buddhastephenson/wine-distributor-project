import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

// Extend Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: any; // Replace 'any' with IUser document type if available
        }
    }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
        console.log('Auth Middleware: No User ID provided');
        return res.status(401).json({ error: 'Unauthorized: Missing User Context' });
    }

    try {
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized: Invalid User' });
        }

        if (user.accessRevoked) {
            return res.status(403).json({ error: 'Access Revoked' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
