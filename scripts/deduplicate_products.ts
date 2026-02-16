
import mongoose, { Schema } from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: path.join(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wine-distributor';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Define minimal schemas inline to avoid import issues
const ProductSchema = new Schema({}, { strict: false, timestamps: true });
const Product = mongoose.model('Product', ProductSchema);

const SpecialOrderSchema = new Schema({}, { strict: false, timestamps: true });
const SpecialOrder = mongoose.model('SpecialOrder', SpecialOrderSchema);

const runDeduplication = async () => {
    await connectDB();

    console.log('Starting product deduplication scan...');

    try {
        // 1. Find duplicates
        const pipeline = [
            {
                $group: {
                    _id: { itemCode: "$itemCode", supplier: "$supplier" },
                    count: { $sum: 1 },
                    docs: { $push: { id: "$id", updatedAt: "$updatedAt", uploadDate: "$uploadDate", _id: "$_id", productName: "$productName" } }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ];

        const duplicates = await Product.aggregate(pipeline);

        console.log(`Found ${duplicates.length} groups of duplicate products.`);

        if (duplicates.length === 0) {
            console.log('No duplicates found.');
            process.exit(0);
        }

        let totalMerged = 0;
        let totalDeleted = 0;

        for (const group of duplicates) {
            const { itemCode, supplier } = group._id;
            console.log(`\nProcessing duplicates for ItemCode: ${itemCode}, Supplier: ${supplier}`);

            // Sort docs to find the "winner"
            // Start with sorting by updatedAt desc, then uploadDate desc
            const docs = group.docs.sort((a: any, b: any) => {
                const dateA = new Date(a.updatedAt || a.uploadDate || 0).getTime();
                const dateB = new Date(b.updatedAt || b.uploadDate || 0).getTime();
                return dateB - dateA; // Descending
            });

            const winner = docs[0];
            const losers = docs.slice(1);

            console.log(`  Winner: ${winner.id} (Updated: ${winner.updatedAt || winner.uploadDate}) - ${winner.productName}`);
            console.log(`  Losers: ${losers.length} to delete.`);

            const loserIds = losers.map((l: any) => l.id);

            // 2. Re-assign orders
            const updateResult = await SpecialOrder.updateMany(
                { productId: { $in: loserIds } },
                { $set: { productId: winner.id } }
            );

            if (updateResult.modifiedCount > 0) {
                console.log(`  Re-assigned ${updateResult.modifiedCount} orders to winner.`);
            }

            // 3. Delete losers
            const deleteResult = await Product.deleteMany({
                id: { $in: loserIds }
            });

            console.log(`  Deleted ${deleteResult.deletedCount} duplicate products.`);
            totalDeleted += deleteResult.deletedCount;
            totalMerged++;
        }

        console.log('\n-----------------------------------');
        console.log(`Deduplication Complete.`);
        console.log(`Total Groups Processed: ${totalMerged}`);
        console.log(`Total Products Deleted: ${totalDeleted}`);

        process.exit(0);

    } catch (error) {
        console.error('Error during deduplication:', error);
        process.exit(1);
    }
};

runDeduplication();
