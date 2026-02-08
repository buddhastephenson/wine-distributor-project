import Product from '../models/Product';
import { IProduct } from '../../shared/types';

class ProductService {
    async getAllProducts(): Promise<IProduct[]> {
        return await Product.find({}, '-_id -__v -createdAt -updatedAt').lean();
    }

    async getProductById(id: string): Promise<IProduct | null> {
        return await Product.findOne({ id }, '-_id -__v -createdAt -updatedAt').lean();
    }

    async updateProduct(id: string, updates: Partial<IProduct>): Promise<IProduct | null> {
        const product = await Product.findOneAndUpdate({ id }, updates, { new: true });
        return product ? product.toObject() : null; // toObject might be needed if strict typing issues, or lean() on query
    }

    async deleteProduct(id: string): Promise<boolean> {
        const result = await Product.findOneAndDelete({ id });
        return !!result;
    }

    // Legacy Bulk Import Logic
    async bulkUpsertProducts(products: IProduct[]): Promise<void> {
        // 1. Identify IDs in the new payload
        const incomingIds = products.map(item => item.id);

        // 2. Delete items in DB that are NOT in the payload (Sync deletion)
        await Product.deleteMany({ id: { $nin: incomingIds } });

        // 3. Upsert items from payload
        for (const item of products) {
            await Product.findOneAndUpdate({ id: item.id }, item, { upsert: true });
        }
    }
}

export default new ProductService();
