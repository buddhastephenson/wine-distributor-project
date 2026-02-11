const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wine-distributor';

const userSchema = new mongoose.Schema({
    username: String,
    type: String, // 'admin', 'customer', 'vendor'
    vendors: [String]
}, { strict: false });

const User = mongoose.model('User', userSchema);

const username = process.argv[2];

if (!username) {
    console.error('Please provide a username to promote to vendor. Usage: node scripts/ensure_vendor.js "Username"');
    process.exit(1);
}

async function promoteToVendor() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        const user = await User.findOne({ username });

        if (!user) {
            console.error(`User "${username}" not found!`);
            process.exit(1);
        }

        console.log(`Found user: ${user.username} (Current Type: ${user.type})`);

        user.type = 'vendor';
        // Ensure they are assigned to themselves as the vendor
        if (!user.vendors || !user.vendors.includes(username)) {
            user.vendors = [username];
        }

        await user.save();

        console.log(`SUCCESS: Updated ${user.username} to type 'vendor' with vendor association '${username}'.`);
        console.log('You should now see the "Import" link in the sidebar (Refresh your browser).');

    } catch (error) {
        console.error('Error updating user:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

promoteToVendor();
