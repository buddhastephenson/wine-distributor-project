const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Define User Schema inline to avoid TS compilation issues for a quick script
const userSchema = new mongoose.Schema({
    id: String,
    username: String,
    email: String,
    password: String,
    type: String, // 'admin' | 'customer'
    isSuperAdmin: Boolean,
    status: { type: String, enum: ['active', 'pending', 'rejected'], default: 'active' },
    vendors: [String],
    accessRevoked: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wine-distributor';

async function restoreAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const username = 'Trey';
        const rawPassword = 'Richelieu';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rawPassword, salt);

        const adminData = {
            id: 'user-' + Date.now(), // Only used if creating new
            username: 'Trey',
            email: 'trey@aocwinecompany.com', // Placeholder email if not known
            password: hashedPassword,
            type: 'admin',
            isSuperAdmin: true,
            status: 'active',
            vendors: [],
            accessRevoked: false
        };

        // Try to find and update, or create
        const existingUser = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });

        if (existingUser) {
            console.log(`User '${username}' found. Updating password and permissions...`);
            existingUser.password = hashedPassword;
            existingUser.isSuperAdmin = true;
            existingUser.type = 'admin';
            existingUser.status = 'active';
            existingUser.accessRevoked = false;
            await existingUser.save();
            console.log('User updated successfully.');
        } else {
            console.log(`User '${username}' not found. Creating new Super Admin...`);
            await User.create(adminData);
            console.log('User created successfully.');
        }

        console.log('Done!');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

restoreAdmin();
