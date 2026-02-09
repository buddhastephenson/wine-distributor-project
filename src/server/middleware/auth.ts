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
        // Allow public access for now? Or deny?
        // Current app assumes public read for products? No, CatalogPage requires login.
        // Let's make it optional for GET but required for write?
        // For 'Vendor Visibility' we NEED to know who they are.
        // If no ID, we assume Public/Guest (which might see nothing or everything depending on policy).
        // Let's enforce it for now, or assume guest if missing.
        console.log('Auth Middleware: No User ID provided');
        // req.user = undefined;
        // next();
        // return;

        // Actually, preventing unauthorized API access is better.
        // But login/signup routes must be excluded.
        // We will apply this middleware specifically to routes that need it, not globally.
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
