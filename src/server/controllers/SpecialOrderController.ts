import { Request, Response } from 'express';
import SpecialOrderService from '../services/SpecialOrderService';

class SpecialOrderController {
    async getAllSpecialOrders(req: Request, res: Response) {
        try {
            const { username } = req.query;
            let orders;
            if (username && typeof username === 'string') {
                orders = await SpecialOrderService.getSpecialOrdersByUsername(username); // Username filter overrides? or ANDs? 
                // Actually if a Vendor queries by username, they should still only see that user's orders FOR THAT VENDOR.
                // So we should probably pass user to both.
                orders = await SpecialOrderService.getSpecialOrdersByUsername(username, req.user);
            } else {
                orders = await SpecialOrderService.getAllSpecialOrders(req.user);
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
            const order = await SpecialOrderService.updateSpecialOrder(id as string, req.body);
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
