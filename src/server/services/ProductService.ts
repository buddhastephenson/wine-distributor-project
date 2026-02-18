import Product from '../models/Product';
import SpecialOrder from '../models/SpecialOrder';
import mongoose from 'mongoose';
import { IProduct } from '../../shared/types';

import { IUser } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';
import AuthService from './AuthService';
import User from '../models/User';

class ProductService {
    async getAllProducts(user?: IUser): Promise<IProduct[]> {
        let query: any = {};

        // Filter for Vendor Admins
        if (user && (user.type === 'admin' || user.type === 'vendor') && user.vendors && user.vendors.length > 0) {
            // Only show products where supplier is in their allowed list
            if (user.type === 'vendor') {
                // Vendors see assigned suppliers OR products they created/own directly
                query.$or = [
                    { supplier: { $in: user.vendors } },
                    { vendor: user.id }
                ];
            } else {
                query.supplier = { $in: user.vendors };
            }
        } else if (user && user.type === 'vendor') {
            // Vendors only see products they own
            query.vendor = user.id;
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



    async bulkImport(products: IProduct[], supplier: string, vendorId?: string): Promise<{ added: number, updated: number, deleted: number, kept: number, supplier: string }> {

        // --- VENDOR ASSOCIATION LOGIC ---
        if (vendorId) {
            console.log(`Processing Vendor Association: ID=${vendorId}`);
            // Update Existing Vendor User
            try {
                const user = await User.findOne({ id: vendorId });
                if (user) {
                    // Add supplier if not present
                    if (!user.vendors) user.vendors = [];
                    if (!user.vendors.includes(supplier)) {
                        user.vendors.push(supplier);
                        // Ensure they are promoted to restricted admin (Vendor) if not already
                        // logic: if they are being assigned a portfolio, they must be a vendor type.
                        // User said: "Vendor is created by an Admin as a User with Vendor credentials"
                        // We'll enforce the restricted admin structure just to be safe so permissions work.
                        if (user.type !== 'admin' || user.isSuperAdmin) {
                            user.type = 'admin';
                            user.isSuperAdmin = false;
                        }
                        await user.save();
                        console.log(`Associated supplier ${supplier} to existing vendor user ${user.username}`);
                    }
                } else {
                    console.warn(`Vendor User ID ${vendorId} not found`);
                }
            } catch (e) {
                console.error('Error updating existing vendor association:', e);
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

    async bulkUpsertProducts(products: IProduct[]): Promise<void> {
        if (!Array.isArray(products)) return;

        const operations = products.map(p => ({
            updateOne: {
                filter: { id: p.id },
                update: { $set: p },
                upsert: true
            }
        }));

        if (operations.length > 0) {
            await Product.bulkWrite(operations);
        }
    }

    async findDuplicates(): Promise<any[]> {
        const pipeline = [
            {
                $group: {
                    _id: { itemCode: "$itemCode", supplier: "$supplier" },
                    count: { $sum: 1 },
                    docs: { $push: { id: { $ifNull: ["$id", { $toString: "$_id" }] }, updatedAt: "$updatedAt", uploadDate: "$uploadDate", productName: "$productName", itemCode: "$itemCode", supplier: "$supplier", vintage: "$vintage", bottleSize: "$bottleSize" } }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ];

        return await Product.aggregate(pipeline);
    }

    async deduplicate(groups: { winnerId: string, loserIds: string[] }[]): Promise<{ merged: number, deleted: number }> {
        let totalMerged = 0;
        let totalDeleted = 0;

        for (const group of groups) {
            // Re-assign orders
            const updateResult = await SpecialOrder.updateMany(
                { productId: { $in: group.loserIds } },
                { $set: { productId: group.winnerId } }
            );

            if (updateResult.modifiedCount > 0) {
                console.log(`Re-assigned ${updateResult.modifiedCount} orders to winner ${group.winnerId}`);
            }

            // Delete losers (check both id and _id for legacy compatibility)
            // SAFELY handle _id query by filtering for valid ObjectIds first
            const validObjectIds = group.loserIds
                .filter(id => mongoose.Types.ObjectId.isValid(id))
                .map(id => new mongoose.Types.ObjectId(id));

            const deleteResult = await Product.deleteMany({
                $or: [
                    { id: { $in: group.loserIds } },
                    { _id: { $in: validObjectIds } }
                ]
            });

            totalDeleted += deleteResult.deletedCount;
            totalMerged++;
        }

        return { merged: totalMerged, deleted: totalDeleted };
    }

    // --- Supplier Management ---

    async getSupplierStats(): Promise<{ supplier: string, count: number }[]> {
        // Aggregate products by supplier to get counts
        const stats = await Product.aggregate([
            { $group: { _id: { $ifNull: ["$supplier", ""] }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
            { $project: { supplier: "$_id", count: 1, _id: 0 } }
        ]);
        return stats;
    }

    async renameSupplier(oldName: string, newName: string): Promise<{ productsUpdated: number, ordersUpdated: number }> {
        // 1. Update Products
        const productResult = await Product.updateMany(
            { supplier: oldName },
            { $set: { supplier: newName } }
        );

        // 2. Update Special Orders (Historical accuracy vs Live data)
        // Ideally we update them so history reflects the "current" name of the portfolio
        const orderResult = await SpecialOrder.updateMany(
            { supplier: oldName },
            { $set: { supplier: newName } }
        );

        return {
            productsUpdated: productResult.modifiedCount,
            ordersUpdated: orderResult.modifiedCount
        };
    }

    async deleteSupplier(name: string): Promise<{ productsDeleted: number, ordersUpdated: number }> {
        // 1. Delete Products
        const productResult = await Product.deleteMany({ supplier: name });

        // 2. ORPHAN special orders? Or just leave them?
        // If we delete the products, the orders might still exist but point to nothing.
        // Let's NOT delete orders, but maybe mark them? Or leave them as history.
        // Requirement was "delete all products".

        // We will log how many orders are affected (orphaned)
        const affectedOrders = await SpecialOrder.countDocuments({ supplier: name });

        return {
            productsDeleted: productResult.deletedCount,
            ordersUpdated: affectedOrders // valid but potentially orphaned
        };
    }
}

export default new ProductService();
