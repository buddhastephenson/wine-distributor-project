import { Request, Response } from 'express';
import ProductService from '../services/ProductService';
import SpecialOrderService from '../services/SpecialOrderService';
import Taxonomy from '../models/Taxonomy';
import Storage from '../models/Storage';
import { ISpecialOrder } from '../../shared/types';

const DEFAULT_FORMULAS = {
    wine: {
        taxPerLiter: 0.32,
        taxFixed: 0.15,
        shippingPerCase: 13,
        marginDivisor: 0.65,
        srpMultiplier: 1.47
    },
    spirits: {
        taxPerLiter: 1.17,
        taxFixed: 0.15,
        shippingPerCase: 13,
        marginDivisor: 0.65,
        srpMultiplier: 1.47
    },
    nonAlcoholic: {
        taxPerLiter: 0,
        taxFixed: 0,
        shippingPerCase: 13,
        marginDivisor: 0.65,
        srpMultiplier: 1.47
    }
};

class LegacyController {
    // GET /api/storage/:key
    async getStorage(req: Request, res: Response) {
        const key = req.params.key;

        try {
            let result = null;

            if (key === 'wine-products') {
                const products = await ProductService.getAllProducts();
                result = products;
            } else if (key === 'wine-special-orders') {
                // Frontend expects { "username": [order1, order2], ... }
                const allOrders = await SpecialOrderService.getAllSpecialOrders();
                const grouped: Record<string, ISpecialOrder[]> = {};
                for (const order of allOrders) {
                    if (!grouped[order.username]) grouped[order.username] = [];
                    grouped[order.username].push(order);
                }
                result = grouped;
            } else if (key === 'taxonomy') {
                const taxDoc = await Taxonomy.findOne({ name: 'main_taxonomy' });
                result = taxDoc ? taxDoc.data : {};
            } else if (key === 'wine-formulas') {
                const doc = await Storage.findOne({ key });
                try {
                    result = doc ? JSON.parse(doc.value) : DEFAULT_FORMULAS;
                } catch (e) {
                    console.warn('Failed to parse wine-formulas, using default:', e);
                    result = DEFAULT_FORMULAS;
                }
            } else if (['wine-discontinued', 'wine-suspended', 'wine-inventory'].includes(key as string)) {
                result = [];
            } else {
                const doc = await Storage.findOne({ key });
                result = doc ? JSON.parse(doc.value) : null;
            }

            res.json({ value: result ? JSON.stringify(result) : null });
        } catch (error) {
            console.error(`Legacy API Error reading key ${key}:`, error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // POST /api/storage/:key
    async postStorage(req: Request, res: Response) {
        const key = req.params.key;
        const { value } = req.body; // value is a JSON string

        try {
            const data = JSON.parse(value);

            if (key === 'wine-products') {
                await ProductService.bulkUpsertProducts(data);
            } else if (key === 'wine-special-orders') {
                await SpecialOrderService.bulkUpsertSpecialOrders(data);
            } else if (key === 'taxonomy') {
                await Taxonomy.findOneAndUpdate({ name: 'main_taxonomy' }, { data }, { upsert: true });
            } else {
                await Storage.findOneAndUpdate(
                    { key },
                    { value },
                    { upsert: true }
                );
            }

            res.json({ success: true });
        } catch (error) {
            console.error(`Legacy API Error saving key ${key}:`, error);
            res.status(500).json({ error: 'Failed to save data' });
        }
    }

    // DELETE /api/storage/:key (Not implemented fully in legacy)
    async deleteStorage(req: Request, res: Response) {
        res.status(501).json({ error: 'Not implemented' });
    }
}

export default new LegacyController();
