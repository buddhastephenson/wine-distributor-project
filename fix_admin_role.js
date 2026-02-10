const mongoose = require('mongoose');

// Default to the same fallback as the app
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wine-distributor';

async function fixAdminRole(targetUsername) {
    if (!targetUsername) {
        console.error('Please provide a username. Usage: node fix_admin_role.js "Username"');
        process.exit(1);
    }

    console.log(`Connecting to database at ${MONGO_URI}...`);

    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        const UserSchema = new mongoose.Schema({
            username: String,
            type: String,
            isSuperAdmin: Boolean
        }, { strict: false });

        const User = mongoose.model('User', UserSchema);

        const user = await User.findOne({ username: { $regex: new RegExp(`^${targetUsername}$`, 'i') } });

        if (!user) {
            console.error(`User "${targetUsername}" not found.`);
            process.exit(1);
        }

        console.log(`Found user: ${user.username}`);
        console.log(`Current Role: ${user.type}`);

        console.log(`Restoring to Admin...`);
        user.type = 'admin';
        user.isSuperAdmin = true;

        await user.save();
        console.log('User role RESTORED to "admin" (Super Admin).');

        process.exit(0);

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

const target = process.argv[2] || 'Trey';
fixAdminRole(target);
