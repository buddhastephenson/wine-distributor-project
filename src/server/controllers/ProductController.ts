import { Request, Response } from 'express';
import ProductService from '../services/ProductService';

class ProductController {
    async getAllProducts(req: Request, res: Response) {
        try {
            const products = await ProductService.getAllProducts();
            res.json(products); // Or wrap in { value: JSON.stringify(products) } if legacy? No, NEW API should be clean JSON.
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch products' });
        }
    }

    async updateProduct(req: Request, res: Response) {
        const { id } = req.params;
        const updates = req.body;

        try {
            const product = await ProductService.updateProduct(id as string, updates);
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }
            res.json({ success: true, product });
        } catch (error) {
            console.error(`Error updating product ${id}:`, error);
            res.status(500).json({ error: 'Failed to update product' });
        }
    }

    async deleteProduct(req: Request, res: Response) {
        const { id } = req.params;

        try {
            const success = await ProductService.deleteProduct(id as string);
            if (!success) {
                return res.status(440).json({ error: 'Product not found' });
            }
            res.json({ success: true, message: 'Product deleted' });
        } catch (error) {
            console.error(`Error deleting product ${id}:`, error);
            res.status(500).json({ error: 'Failed to delete product' });
        }
    }
}

export default new ProductController();
