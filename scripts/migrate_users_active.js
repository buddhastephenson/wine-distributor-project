const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wine-distributor';

const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    type: { type: String },
    status: { type: String }
}, { strict: false }); // Strict false to allow working with existing fields

const User = mongoose.model('User', UserSchema);

const migrateUsers = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        console.log('Finding users without active status...');

        // Find users who are NOT explicitly active (missing or pending)
        const users = await User.find({
            $or: [
                { status: { $exists: false } },
                { status: 'pending' },
                { status: null }
            ]
        });

        console.log(`Found ${users.length} users to update.`);

        for (const user of users) {
            console.log(`Updating user: ${user.username} (${user.id}) -> active`);
            user.status = 'active';

            // Also ensure Trey is super admin if found
            if (user.username.toLowerCase() === 'trey') {
                user.isSuperAdmin = true;
                console.log('  -> Setting Trey to Super Admin');
            }

            await user.save();
        }

        console.log('Migration complete.');
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateUsers();
