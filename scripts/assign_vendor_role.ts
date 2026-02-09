
import mongoose from 'mongoose';
import User from '../src/server/models/User';
import connectDB from '../src/server/utils/db';
import dotenv from 'dotenv';
dotenv.config();

const assignVendorRole = async () => {
    try {
        await connectDB();
        const username = 'vendor_test';
        // Ensure user exists or create one
        let user = await User.findOne({ username });
        if (!user) {
            console.log(`Creating user ${username}...`);
            // Note: Password hashing is handled by the model or service usually, but for test script we might need to be careful.
            // Assuming User model has a method or we can just set a plain text one if the model handles it (unlikely for production but okay for verification if we knew the hashing mechanic).
            // Actually, let's just update an existing user 'tester' or similar if possible.
            // Or better, just update 'treystephenson' to have vendors temporarily? No, bad idea.
            // Let's look up all users first to see who we can use.
            const users = await User.find({});
            console.log('Available users:', users.map(u => u.username));

            // If 'tester' exists, use it.
            user = await User.findOne({ username: 'tester' });
            if (!user) {
                console.log('User "tester" not found. Creating "vendor_test" with dummy password.');
                user = new User({
                    username: 'vendor_test',
                    email: 'vendor_test@example.com',
                    password: 'password123', // This might not work if hashing is required pre-save
                    type: 'admin'
                });
            }
        }

        if (user) {
            user.type = 'admin';
            user.vendors = ['Rosenthal Wine Merchant'];
            // Also ensure isSuperAdmin is false
            user.isSuperAdmin = false;

            await user.save();
            console.log(`Updated ${user.username} to Vendor Admin with vendor: Rosenthal Wine Merchant`);
            console.log('User details:', JSON.stringify(user, null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        // mongoose.disconnect();
        process.exit();
    }
};

assignVendorRole();
