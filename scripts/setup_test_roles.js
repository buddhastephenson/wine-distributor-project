const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/wine-distributor')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error(err));

const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    type: { type: String, enum: ['admin', 'customer', 'vendor'], default: 'customer' },
    isSuperAdmin: { type: Boolean, default: false },
    vendors: { type: [String], default: [] }, // Array of supplier names for Vendor Admins
    email: { type: String, required: true, unique: true },
    accessRevoked: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function createTestUsers() {
    try {
        const passwordHash = await bcrypt.hash('password123', 10);

        // 1. Create Rep User (Admin, Not Super)
        const repUser = await User.findOneAndUpdate(
            { username: 'TestRep' },
            {
                id: 'user-rep-test',
                username: 'TestRep',
                password: passwordHash,
                type: 'admin',
                isSuperAdmin: false,
                email: 'testrep@example.com',
                accessRevoked: false
            },
            { upsert: true, new: true }
        );
        console.log('Created/Updated Rep User:', repUser.username);

        // 2. Create Vendor User (Vendor, Scoped to "Indigenous Selections")
        // Note: Assuming "Indigenous Selections" is a valid supplier name in the DB
        const vendorUser = await User.findOneAndUpdate(
            { username: 'TestVendor' },
            {
                id: 'user-vendor-test',
                username: 'TestVendor',
                password: passwordHash,
                type: 'vendor',
                vendors: ['Indigenous Selections'],
                email: 'testvendor@example.com',
                accessRevoked: false
            },
            { upsert: true, new: true }
        );
        console.log('Created/Updated Vendor User:', vendorUser.username);

        // 3. Ensure Super Admin exists (Trey)
        const superAdmin = await User.findOneAndUpdate(
            { username: 'Trey' },
            {
                isSuperAdmin: true,
                type: 'admin'
            },
            { new: true }
        );
        console.log('Ensured Super Admin:', superAdmin?.username);

    } catch (error) {
        console.error('Error creating users:', error);
    } finally {
        mongoose.disconnect();
    }
}

createTestUsers();
