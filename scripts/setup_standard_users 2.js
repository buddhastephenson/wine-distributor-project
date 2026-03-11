const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    type: { type: String, required: true },
    email: { type: String },
    isSuperAdmin: { type: Boolean, default: false },
    vendors: { type: [String], default: [] }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function setupUsers() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wine-distributor');

        const salt = await bcrypt.genSalt(10);

        const usersToSetup = [
            {
                username: 'Customer',
                password: 'Customer',
                type: 'customer',
                email: 'customer@test.com'
            },
            {
                username: 'Admin Rep',
                password: 'Admin Rep',
                type: 'admin', // Assuming Admin Rep is an admin
                email: 'adminrep@test.com',
                isSuperAdmin: false
            },
            {
                username: 'Vendor',
                password: 'Vendor',
                type: 'admin',
                email: 'vendor@test.com',
                vendors: ['Dalla Terra'] // Assign a dummy vendor so they act as a vendor admin
            }
        ];

        for (const u of usersToSetup) {
            const hashedPassword = await bcrypt.hash(u.password, salt);

            const existing = await User.findOne({ username: u.username });
            if (existing) {
                existing.password = hashedPassword;
                existing.type = u.type;
                existing.email = u.email;
                if (u.vendors) existing.vendors = u.vendors;
                await existing.save();
                console.log(`Updated user: ${u.username}`);
            } else {
                await User.create({
                    id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    username: u.username,
                    password: hashedPassword,
                    type: u.type,
                    email: u.email,
                    vendors: u.vendors || [],
                    isSuperAdmin: u.isSuperAdmin || false
                });
                console.log(`Created user: ${u.username}`);
            }
        }

        console.log('Test users setup complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

setupUsers();
