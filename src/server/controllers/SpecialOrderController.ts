import { Request, Response } from 'express';
import SpecialOrderService from '../services/SpecialOrderService';

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
}

export default new SpecialOrderController();
