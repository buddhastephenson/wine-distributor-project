
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env
const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wine-distributor';

async function checkDuplicates() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const pipeline = [
            {
                $group: {
                    _id: { itemCode: "$itemCode", supplier: "$supplier" },
                    count: { $sum: 1 },
                    docs: { $push: { id: "$id", productName: "$productName" } }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ];

        const duplicates = await mongoose.connection.collection('products').aggregate(pipeline).toArray();
        console.log(`Found ${duplicates.length} duplicate groups.`);
        console.log(JSON.stringify(duplicates, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkDuplicates();
