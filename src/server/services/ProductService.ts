import Product from '../models/Product';
import SpecialOrder from '../models/SpecialOrder';
import { IProduct } from '../../shared/types';

import { IUser } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';
import AuthService from './AuthService';
import User from '../models/User';

class ProductService {
    async getAllProducts(user?: IUser): Promise<IProduct[]> {
        let query: any = {};

        // Filter for Vendor Admins
        if (user && user.type === 'admin' && user.vendors && user.vendors.length > 0) {
            // Only show products where supplier is in their allowed list
            query.supplier = { $in: user.vendors };
        }

        // Note: Customers and SuperAdmins (or admins with no vendors assigned) see everything.

        return await Product.find(query, '-_id -__v -createdAt -updatedAt').lean();
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

    async createProduct(productData: Partial<IProduct>): Promise<IProduct> {
        const newProduct = new Product({
            id: uuidv4(),
            ...productData,
            uploadDate: new Date()
        });
        const savedProduct = await newProduct.save();
        return savedProduct.toObject();
    }



    async bulkImport(products: IProduct[], supplier: string, vendorId?: string, newVendorName?: string): Promise<{ added: number, updated: number, deleted: number, kept: number, supplier: string }> {

        // --- VENDOR ASSOCIATION LOGIC ---
        if (vendorId || newVendorName) {
            console.log(`Processing Vendor Association: ID=${vendorId}, NewName=${newVendorName}`);
            if (newVendorName) {
                // Create New Vendor User
                try {
                    const result = await AuthService.quickCreateCustomer(newVendorName);
                    if (result.success && result.user) {
                        console.log(`Created new vendor user: ${result.user.username} (${result.user.id})`);
                        // Promote to Admin/Vendor and assign supplier
                        await User.findOneAndUpdate(
                            { id: result.user.id },
                            {
                                type: 'admin',
                                vendors: [supplier]
                            }
                        );
                        console.log(`Promoted ${result.user.username} to Admin with vendor ${supplier}`);
                    } else {
                        console.error(`Failed to create new vendor user: ${result.error}`);
                        throw new Error(`Failed to create vendor: ${result.error}`);
                    }
                } catch (e: any) {
                    console.error('Vendor creation error:', e);
                    throw new Error(`Vendor creation failed: ${e.message}`);
                }
            } else if (vendorId) {
                // Update Existing Vendor
                try {
                    const user = await User.findOne({ id: vendorId });
                    if (user) {
                        // Add supplier if not present
                        if (!user.vendors) user.vendors = [];
                        if (!user.vendors.includes(supplier)) {
                            user.vendors.push(supplier);
                            await user.save();
                            console.log(`Added supplier ${supplier} to existing vendor ${user.username}`);
                        }
                    } else {
                        console.warn(`Vendor ID ${vendorId} not found`);
                    }
                } catch (e) {
                    console.error('Error updating existing vendor:', e);
                }
            }
        }
        // --------------------------------

        // 1. Get Active Orders for this supplier
        // Find itemCodes of products currently on active requests
        // Active = not delivered, not cancelled/archived
        const activeOrders = await SpecialOrder.find({
            supplier: supplier,
            status: { $nin: ['Delivered', 'Cancelled', 'Out of Stock'] },
            isArchived: { $ne: true }
        }).select('itemCode');

        const activeItemCodes = new Set(activeOrders.map((o: any) => o.itemCode));
        const newItemCodes = new Set(products.map(p => p.itemCode));

        // 2. Identify "Old Products to Keep"
        // These are products that exist in DB, are on active orders, but are NOT in the new payload.
        // We must ensure we don't delete them.

        // 3. Delete products for this supplier that are NOT in the new list AND NOT in active orders
        const keepCodes = Array.from(activeItemCodes).filter((code: any) => !newItemCodes.has(code));
        const protectCodes = [...Array.from(newItemCodes), ...keepCodes];

        const deleteResult = await Product.deleteMany({
            supplier: supplier,
            itemCode: { $nin: protectCodes }
        } as any);

        // 4. Upsert the new products
        let added = 0;
        let updated = 0;

        // Use bulkWrite for efficiency
        const operations = products.map(p => {
            // Ensure we don't overwrite existing ID if we are updating
            const { id, ...productData } = p;

            return {
                updateOne: {
                    filter: { itemCode: p.itemCode, supplier: supplier }, // Use composite key
                    update: {
                        $set: { ...productData, uploadDate: new Date() },
                        $setOnInsert: { id: uuidv4() }
                    },
                    upsert: true
                }
            };
        });

        if (operations.length > 0) {
            const bulkResult = await Product.bulkWrite(operations);
            added = bulkResult.upsertedCount;
            updated = bulkResult.modifiedCount; // This counts matched & modified
            // Note: bulkWrite result is complex, matchedCount includes upserts if matched. 
            // Simple approximation is fine for now.
        }

        return {
            added,
            updated,
            deleted: deleteResult.deletedCount,
            kept: keepCodes.length,
            supplier
        };
    }
}

export default new ProductService();
