import { Request, Response } from 'express';
import ProductService from '../services/ProductService';

class ProductController {
    async getAllProducts(req: Request, res: Response) {
        try {
            // Pass the user context (req.user is attached by auth middleware)
            const products = await ProductService.getAllProducts(req.user);
            res.json(products);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch products' });
        }
    }

    async updateProduct(req: Request, res: Response) {
        const { id } = req.params;
        const updates = req.body;
        const user = req.user;

        try {
            // Permission Check
            if (user?.type === 'admin' && user.vendors && user.vendors.length > 0) {
                // Must fetch product to check supplier
                const existingProduct = await ProductService.getProductById(id as string);
                if (!existingProduct) return res.status(404).json({ error: 'Product not found' });

                if (!existingProduct.supplier || !user.vendors.includes(existingProduct.supplier)) {
                    return res.status(403).json({ error: 'Unauthorized: You can only edit your own products.' });
                }

                // Also prevent changing supplier to one they don't own?
                if (updates.supplier && !user.vendors.includes(updates.supplier)) {
                    return res.status(403).json({ error: 'Unauthorized: Cannot transfer product to another supplier.' });
                }
            }

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
        const user = req.user;

        try {
            // Permission Check
            if (user?.type === 'admin' && user.vendors && user.vendors.length > 0) {
                const existingProduct = await ProductService.getProductById(id as string);
                if (!existingProduct) return res.status(404).json({ error: 'Product not found' });

                if (!existingProduct.supplier || !user.vendors.includes(existingProduct.supplier)) {
                    return res.status(403).json({ error: 'Unauthorized: You can only delete your own products.' });
                }
            }

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

    async importProducts(req: Request, res: Response) {
        const { products, supplier } = req.body;
        const user = req.user;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'Invalid products data' });
        }
        if (!supplier) {
            return res.status(400).json({ error: 'Supplier is required for bulk import' });
        }

        // Permission Check
        if (user?.type === 'admin' && user.vendors && user.vendors.length > 0) {
            if (!user.vendors.includes(supplier)) {
                return res.status(403).json({ error: `Unauthorized: You are not authorized to import for ${supplier}.` });
            }
        }

        try {
            const stats = await ProductService.bulkImport(products, supplier);
            res.json({ success: true, stats });
        } catch (error: any) {
            console.error('Import failed:', error);
            res.status(500).json({ error: `Import failed: ${error.message}` });
        }
    }
}

export default new ProductController();
