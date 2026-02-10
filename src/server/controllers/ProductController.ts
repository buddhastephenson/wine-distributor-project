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

    async createProduct(req: Request, res: Response) {
        const productData = req.body;
        const user = req.user;

        try {
            // Permission Check
            if (user?.type === 'admin' && user.vendors && user.vendors.length > 0) {
                if (!productData.supplier) {
                    return res.status(400).json({ error: 'Supplier is required.' });
                }
                if (!user.vendors.includes(productData.supplier)) {
                    return res.status(403).json({ error: 'Unauthorized: You can only create products for your assigned suppliers.' });
                }
            } else if (user?.type === 'vendor') {
                // Vendor-specific logic
                productData.vendor = user.id; // Force vendor ID
                // If they provided a supplier, allow it (maybe they manage multiple portfolios under one name?) 
                // BUT we should probably enforce it matches their known portfolios OR just trust them for now if they are the vendor?
                // Plan said: Ensure `supplier` matches one of `req.user.vendors` (or if empty, use `req.user.username` as the default).
                if (user.vendors && user.vendors.length > 0) {
                    if (!productData.supplier || !user.vendors.includes(productData.supplier)) {
                        // If they have effective portfolios, must match. 
                        // Check if we should auto-assign?
                        return res.status(403).json({ error: 'Unauthorized: You can only create products for your assigned portfolios.' });
                    }
                } else {
                    // If no specific vendors list, default to their username
                    if (!productData.supplier) productData.supplier = user.username;
                }
            }

            // Basic Validation
            if (!productData.productName || !productData.itemCode) {
                return res.status(400).json({ error: 'Product Name and Item Code are required.' });
            }

            const newProduct = await ProductService.createProduct(productData);
            res.status(201).json({ success: true, product: newProduct });
        } catch (error: any) {
            console.error('Error creating product:', error);
            // Check for duplicate key error (11000)
            if (error.code === 11000) {
                return res.status(400).json({ error: 'Product with this Item Code/ID already exists.' });
            }
            res.status(500).json({ error: 'Failed to create product' });
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
            } else if (user?.type === 'vendor') {
                const existingProduct = await ProductService.getProductById(id as string);
                if (!existingProduct) return res.status(404).json({ error: 'Product not found' });

                // Check ownership
                if (String(existingProduct.vendor) !== String(user.id)) {
                    return res.status(403).json({ error: 'Unauthorized: You can only edit your own products.' });
                }

                // Prevent changing vendor ownership
                if (updates.vendor && String(updates.vendor) !== String(user.id)) {
                    return res.status(403).json({ error: 'Unauthorized: Cannot transfer product ownership.' });
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
            } else if (user?.type === 'vendor') {
                const existingProduct = await ProductService.getProductById(id as string);
                if (!existingProduct) return res.status(404).json({ error: 'Product not found' });

                if (String(existingProduct.vendor) !== String(user.id)) {
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
        const { products, supplier, vendorId } = req.body;
        const user = req.user;

        let finalSupplier = supplier;
        let finalVendorId = undefined;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'Invalid products data' });
        }

        // Permission Check
        if (user?.type === 'admin' && user.vendors && user.vendors.length > 0) {
            if (!supplier) {
                return res.status(400).json({ error: 'Supplier is required for bulk import' });
            }
            if (!user.vendors.includes(supplier)) {
                return res.status(403).json({ error: `Unauthorized: You are not authorized to import for ${supplier}.` });
            }
            // Restricted admins can't assign arbitrary vendors? 
            // Currently they can only import for specific SUPPLIERS.
            // If they are managing a supplier, they should be able to assign the vendor who owns it?
            // Let's allow them to set vendorId if passed.
            if (vendorId) finalVendorId = vendorId;

        } else if (user?.type === 'vendor') {
            finalVendorId = user.id;

            // Allow vendor to specify ANY supplier/portfolio name. 
            // If they provided one, use it. If not, default to username.
            if (!supplier) finalSupplier = user.username;

        } else {
            // Super Admin
            if (!supplier) {
                return res.status(400).json({ error: 'Supplier is required for bulk import' });
            }
            // Use passed vendorId
            if (vendorId) finalVendorId = vendorId;
        }

        try {
            // Need to pass vendorId to service? Service bulkImport doesn't seem to take vendorId yet.
            // I need to update products array to include vendorId before passing to service, 
            // OR update service to accept it.
            // Service.bulkImport(products, supplier) likely iterates and upserts.
            // Let's attach vendorId to each product in the array.

            const productsWithVendor = products.map((p: any) => ({
                ...p,
                vendor: finalVendorId, // Might be undefined for admins, which is fine
                supplier: finalSupplier // Ensure uniform supplier
            }));

            const stats = await ProductService.bulkImport(productsWithVendor, finalSupplier);
            res.json({ success: true, stats });
        } catch (error: any) {
            console.error('Import failed:', error);
            res.status(500).json({ error: `Import failed: ${error.message}` });
        }
    }
}

export default new ProductController();
