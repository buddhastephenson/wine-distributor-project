
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env
const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wine-distributor';

// Function to find duplicates manually since we can't easily import the service with raw node/ts-node without config
async function findDuplicates() {
    // Manually define schema to avoid model import issues
    const ProductSchema = new mongoose.Schema({}, { strict: false });
    const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

    const pipeline = [
        {
            $group: {
                _id: { itemCode: "$itemCode", supplier: "$supplier" },
                count: { $sum: 1 },
                docs: { $push: { id: { $ifNull: ["$id", { $toString: "$_id" }] }, _id: "$_id", updatedAt: "$updatedAt", uploadDate: "$uploadDate", productName: "$productName", itemCode: "$itemCode", supplier: "$supplier" } }
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

async function deduplicate(groups: any[]) {
    const ProductSchema = new mongoose.Schema({}, { strict: false });
    const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

    // We also need SpecialOrder model
    const SpecialOrderSchema = new mongoose.Schema({}, { strict: false });
    const SpecialOrder = mongoose.models.SpecialOrder || mongoose.model('SpecialOrder', SpecialOrderSchema);

    let totalMerged = 0;
    let totalDeleted = 0;

    for (const group of groups) {
        console.log(`Processing group: Winner ${group.winnerId}, Losers ${group.loserIds.join(', ')}`);

        // Re-assign orders
        // Note: SpecialOrder might use 'productId' which refers to 'id' string, NOT _id object in some legacy cases.
        // We should check if we need to cast to ObjectId or not. 
        // Based on previous files, 'productId' seems to be a string.

        try {
            const updateResult = await SpecialOrder.updateMany(
                { productId: { $in: group.loserIds } },
                { $set: { productId: group.winnerId } }
            );

            if (updateResult.modifiedCount > 0) {
                console.log(`Re-assigned ${updateResult.modifiedCount} orders to winner ${group.winnerId}`);
            }
        } catch (err) {
            console.error("Error updating orders:", err);
            throw err;
        }

        // Delete losers 
        // We need to handle both 'id' (legacy string) and '_id' (Mongo ObjectId)
        // The service does: 
        /*
        const deleteResult = await Product.deleteMany({
                    $or: [
                        { id: { $in: group.loserIds } },
                        { _id: { $in: group.loserIds } }
                    ]
                });
        */

        try {
            // Convert strings to ObjectIds if possible for _id query
            const validObjectIds = group.loserIds.filter((id: string) => mongoose.Types.ObjectId.isValid(id)).map((id: string) => new mongoose.Types.ObjectId(id));

            const deleteResult = await Product.deleteMany({
                $or: [
                    { id: { $in: group.loserIds } },
                    { _id: { $in: validObjectIds } } // Ensure we check _id with actual ObjectIds
                ]
            });

            console.log(`Deleted ${deleteResult.deletedCount} loser products.`);
            totalDeleted += deleteResult.deletedCount;
            totalMerged++;

        } catch (err) {
            console.error("Error deleting products:", err);
            throw err;
        }
    }

    return { merged: totalMerged, deleted: totalDeleted };
}

async function debugDeduplication() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Find the test duplicates we created
        const duplicates = await findDuplicates();
        console.log(`Found ${duplicates.length} duplicate groups.`);

        if (duplicates.length === 0) {
            console.log("No duplicates found to test with.");
            return;
        }

        const testGroup = duplicates[0];
        console.log("Testing with group:", JSON.stringify(testGroup._id));

        // 2. Prepare payload
        // Assume first doc is winner, rest are losers
        const winnerId = testGroup.docs[0].id;
        const loserIds = testGroup.docs.slice(1).map((d: any) => d.id);

        console.log(`Winner: ${winnerId}`);
        console.log(`Losers: ${loserIds}`);

        const groupToMerge = {
            winnerId,
            loserIds
        };

        // 3. Execute
        console.log("Executing deduplication...");
        const result = await deduplicate([groupToMerge]);
        console.log("Deduplication Result:", result);

    } catch (error) {
        console.error('DEDUPLICATION FAILED:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debugDeduplication();
