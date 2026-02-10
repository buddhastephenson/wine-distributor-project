
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const checkVendors = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aoc-wines';
        console.log(`Connecting to MongoDB at ${uri}...`);
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('users');

        const allAdmins = await collection.find({ type: 'admin' }).toArray();

        console.log(`Total Admins: ${allAdmins.length}`);

        const vendors = allAdmins.filter(u => u.vendors && u.vendors.length > 0);
        const nonVendors = allAdmins.filter(u => !u.vendors || u.vendors.length === 0);

        console.log('\n--- VENDORS (Should appear in dropdown) ---');
        vendors.forEach(u => console.log(`- ${u.username} (Vendors: ${u.vendors})`));

        console.log('\n--- NON-VENDOR ADMINS (Should NOT appear) ---');
        nonVendors.forEach(u => console.log(`- ${u.username}`));

        process.exit(0);
    } catch (error) {
        console.error('Error checking users:', error);
        process.exit(1);
    }
};

checkVendors();
