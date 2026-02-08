import { Request, Response } from 'express';
import SpecialOrderService from '../services/SpecialOrderService';

class SpecialOrderController {
    async getAllSpecialOrders(req: Request, res: Response) {
        try {
            const { username } = req.query;
            let orders;
            if (username && typeof username === 'string') {
                orders = await SpecialOrderService.getSpecialOrdersByUsername(username);
            } else {
                orders = await SpecialOrderService.getAllSpecialOrders();
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
