
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const fixVendorRoles = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aoc-wines';
        console.log(`Connecting to MongoDB at ${uri}...`);
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('users');

        // Find users that have vendors array but are NOT type 'vendor'
        const usersToFix = await collection.find({
            type: { $ne: 'vendor' },
            vendors: { $exists: true, $not: { $size: 0 } }
        }).toArray();

        console.log(`Found ${usersToFix.length} users to fix.`);

        if (usersToFix.length === 0) {
            console.log('No users need fixing.');
            process.exit(0);
        }

        for (const user of usersToFix) {
            console.log(`Fixing user: ${user.username} (${user._id}) - Current type: ${user.type}`);

            await collection.updateOne(
                { _id: user._id },
                { $set: { type: 'vendor' } }
            );

            console.log(`Updated ${user.username} to type 'vendor'.`);
        }

        console.log('All users processed.');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing vendor roles:', error);
        process.exit(1);
    }
};

fixVendorRoles();
