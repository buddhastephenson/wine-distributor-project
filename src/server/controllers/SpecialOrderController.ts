import { Request, Response } from 'express';
import SpecialOrderService from '../services/SpecialOrderService';
import SpecialOrder from '../models/SpecialOrder';
import User from '../models/User';

class SpecialOrderController {
    async getAllSpecialOrders(req: Request, res: Response) {
        try {
            const { username } = req.query;
            let orders;
            const user = (req as any).user;
            if (username && typeof username === 'string') {
                orders = await SpecialOrderService.getSpecialOrdersByUsername(username, user);
            } else {
                orders = await SpecialOrderService.getAllSpecialOrders(user);
            }
            res.json(orders);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch special orders' });
        }
    }

    async createSpecialOrder(req: Request, res: Response) {
        console.log('Received Special Order Request Body:', JSON.stringify(req.body, null, 2));
        try {
            const order = await SpecialOrderService.createSpecialOrder(req.body);
            res.status(201).json({ success: true, order });
        } catch (error: any) {
            console.error('Create Order Error:', error);
            res.status(500).json({ error: 'Failed to create special order', details: error.message });
        }
    }

    async updateSpecialOrder(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const updates = { ...req.body };
            // If admin is updating, flag it for the customer
            if ((req as any).user?.type === 'admin') {
                updates.hasUnseenUpdate = true;
            }

            const order = await SpecialOrderService.updateSpecialOrder(id as string, updates);
            if (!order) return res.status(404).json({ error: 'Order not found' });
            res.json({ success: true, order });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update order' });
        }
    }

    async batchUpdateStatus(req: Request, res: Response) {
        try {
            const updates = req.body; // Expect array of { id, status }
            if (!Array.isArray(updates)) {
                return res.status(400).json({ error: 'Invalid data format' });
            }

            // If admin, append hasUnseenUpdate to each
            if ((req as any).user?.type === 'admin') {
                updates.forEach(u => (u as any).hasUnseenUpdate = true);
            }

            const result = await SpecialOrderService.batchUpdateStatus(updates);
            res.json({ success: true, ...result });
        } catch (error) {
            res.status(500).json({ error: 'Failed to batch update orders' });
        }
    }

    async deleteSpecialOrder(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const success = await SpecialOrderService.deleteSpecialOrder(id as string);
            if (!success) return res.status(404).json({ error: 'Order not found' });
            res.json({ success: true, message: 'Order deleted' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete order' });
        }
    }

    async bulkDeleteSpecialOrders(req: Request, res: Response) {
        try {
            const { ids } = req.body;
            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ error: 'Invalid or empty IDs array' });
            }

            const success = await SpecialOrderService.deleteSpecialOrders(ids);
            res.json({ success, message: `Deleted ${ids.length} orders` });
        } catch (error) {
            console.error('Bulk Delete Error:', error);
            res.status(500).json({ error: 'Failed to bulk delete orders' });
        }
    }
    // Get historical orders for reporting (Super Admin only)
    async getOrderHistory(req: Request, res: Response) {
        try {
            const { startDate, endDate, status } = req.query;

            // Build query
            const query: any = {};

            // Date filtering (using createdAt)
            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) query.createdAt.$gte = new Date(startDate as string);
                // End date should be end of day
                if (endDate) {
                    const end = new Date(endDate as string);
                    end.setHours(23, 59, 59, 999);
                    query.createdAt.$lte = end;
                }
            }

            // Status filtering
            if (status) {
                // Support multiple statuses comma-separated
                const statuses = (status as string).split(',');
                if (statuses.length > 0) {
                    query.status = { $in: statuses };
                }
            }

            // Fetch orders
            const orders = await SpecialOrder.find(query).sort({ createdAt: -1 });

            // Fetch all current users (id and username)
            // We use this to filter out orders from users that no longer exist
            // Fetch all current users (id and username)
            // We use this to filter out orders from users that no longer exist
            const currentUsers = await User.find({}, 'username');
            const validUsernames = new Set(currentUsers.map((u: any) => u.username.toLowerCase()));
            const validUsernamesOriginal = new Set(currentUsers.map((u: any) => u.username));

            // Filter orders where username is NOT in validUsernames
            // Case-insensitive check might be safest, but let's try strict first then fallback
            const filteredOrders = orders.filter((order: any) => {
                if (!order.username) return false;
                return validUsernames.has(order.username.toLowerCase());
            });

            res.json(filteredOrders);
        } catch (error) {
            console.error('Error fetching order history:', error);
            res.status(500).json({ error: 'Failed to fetch order history' });
        }
    }
}

export default new SpecialOrderController();
