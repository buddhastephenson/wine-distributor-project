const mongoose = require('mongoose');

// Default to the same fallback as the app
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wine-distributor';

// Function to fix the user
async function fixVendorRole(targetUsername) {
    if (!targetUsername) {
        console.error('Please provide a username. Usage: node fix_vendor_role.js "Username"');
        process.exit(1);
    }

    console.log(`Connecting to database at ${MONGO_URI}...`);

    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB.');

        // Define schema inline to avoid import issues
        const UserSchema = new mongoose.Schema({
            username: String,
            type: { type: String, enum: ['admin', 'customer', 'vendor'], default: 'customer' },
            vendors: [String]
        }, { strict: false });

        const User = mongoose.model('User', UserSchema);

        // Find the user (case-insensitive regex)
        const user = await User.findOne({ username: { $regex: new RegExp(`^${targetUsername}$`, 'i') } });

        if (!user) {
            console.error(`User "${targetUsername}" not found.`);
            process.exit(1);
        }

        console.log(`Found user: ${user.username}`);
        console.log(`Current Role: ${user.type}`);
        console.log(`Current Vendors List: ${user.vendors}`);

        // Update role
        if (user.type !== 'vendor') {
            console.log(`Updating role to 'vendor'...`);
            user.type = 'vendor';

            // Ensure they have a vendor list if empty? 
            // The new logic allows empty list (creates new portfolios).
            // But let's verify.

            await user.save();
            console.log('User role updated to "vendor".');
        } else {
            console.log('User is already a vendor.');
        }

        console.log('Done.');
        process.exit(0);

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

// Get username from args
const target = process.argv[2] || 'Dalla Terra';
fixVendorRole(target);
