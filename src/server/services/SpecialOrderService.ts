import SpecialOrder from '../models/SpecialOrder';
import { ISpecialOrder, IUser } from '../../shared/types';

class SpecialOrderService {
    async getAllSpecialOrders(user?: IUser): Promise<ISpecialOrder[]> {
        let query: any = {};
        if (user && (user.type === 'admin' || user.type === 'vendor') && user.vendors && user.vendors.length > 0) {
            query.supplier = { $in: user.vendors };
        }
        return await SpecialOrder.find(query, '-_id -__v -createdAt -updatedAt').lean();
    }

    async getSpecialOrdersByUsername(username: string, user?: IUser): Promise<ISpecialOrder[]> {
        let query: any = { username };
        if (user && (user.type === 'admin' || user.type === 'vendor') && user.vendors && user.vendors.length > 0) {
            query.supplier = { $in: user.vendors };
        }
        return await SpecialOrder.find(query, '-_id -__v -createdAt -updatedAt').lean();
    }

    async getSpecialOrdersByProductId(productId: string, user?: IUser): Promise<ISpecialOrder[]> {
        let query: any = { productId };
        if (user && (user.type === 'admin' || user.type === 'vendor') && user.vendors && user.vendors.length > 0) {
            query.supplier = { $in: user.vendors };
        }
        return await SpecialOrder.find(query, '-_id -__v -updatedAt').sort({ createdAt: -1 }).lean();
    }

    async createSpecialOrder(orderData: Partial<ISpecialOrder>): Promise<ISpecialOrder> {
        // Duplicate prevention: reject if an active (non-Delivered) order exists
        // for the same username + productId
        if (orderData.username && orderData.productId) {
            const existing = await SpecialOrder.findOne({
                username: orderData.username,
                productId: orderData.productId,
                status: { $ne: 'Delivered' },
            }).lean();
            if (existing) {
                const err: any = new Error('This item is already in your active orders.');
                err.code = 'DUPLICATE_ORDER';
                throw err;
            }
        }

        // Generate ID if not provided (though model requires it)
        const id = orderData.id || `so-${Date.now()}`;
        const newOrder = await SpecialOrder.create({ ...orderData, id });
        return newOrder.toObject();
    }

    async updateSpecialOrder(id: string, updates: Partial<ISpecialOrder>) {
        return await SpecialOrder.findOneAndUpdate({ id }, updates, { new: true });
    }

    async batchUpdateStatus(updates: { id: string, status: string }[]) {
        const operations = updates.map(({ id, status }) => ({
            updateOne: {
                filter: { id },
                update: { $set: { status } }
            }
        }));

        if (operations.length === 0) return { modifiedCount: 0 };
        return await SpecialOrder.bulkWrite(operations);
    }

    async deleteSpecialOrder(id: string): Promise<boolean> {
        const result = await SpecialOrder.findOneAndDelete({ id });
        return !!result;
    }

    async deleteSpecialOrders(ids: string[]): Promise<boolean> {
        const result = await SpecialOrder.deleteMany({ id: { $in: ids } });
        return result.deletedCount > 0;
    }

    // Legacy Bulk Import Logic
    async bulkUpsertSpecialOrders(data: Record<string, ISpecialOrder[]>): Promise<void> {
        // data is { "username": [orders...] }

        // 1. Flatten all orders to get all IDs
        const allOrders = Object.values(data).flat();
        const incomingIds = allOrders.map(order => order.id);

        // 2. Delete orders in DB that are NOT in the payload
        await SpecialOrder.deleteMany({ id: { $nin: incomingIds } });

        // 3. Upsert items
        for (const username of Object.keys(data)) {
            const userOrders = data[username];
            for (const order of userOrders) {
                await SpecialOrder.findOneAndUpdate(
                    { id: order.id },
                    { ...order, username },
                    { upsert: true }
                );
            }
        }
    }
}

export default new SpecialOrderService();
