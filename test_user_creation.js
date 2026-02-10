const mongoose = require('mongoose');
require('dotenv').config();

// Mock User Model so we don't need to load the whole app structure if paths are tricky
// But better to try loading the actual service if possible.
// Let's try to replicate the logic of quickCreateCustomer directly to see if Mongoose complains.

const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    type: { type: String, enum: ['admin', 'customer'], default: 'customer' },
    isSuperAdmin: { type: Boolean, default: false },
    vendors: { type: [String], default: [] },
    email: { type: String, required: true, unique: true },
    accessRevoked: { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function testCreation() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wine-distributor');

        const username = "Diamond Wine Importers";
        const sanitizedUsername = username.replace(/[^a-zA-Z0-9]/g, '');
        const dummyEmail = `${sanitizedUsername}-${Date.now()}@placeholder.local`;

        console.log('Attempting to create user:', { username, dummyEmail });

        const newUser = await User.create({
            id: `user-${Date.now()}`,
            username,
            password: username,
            type: 'customer',
            email: dummyEmail
        });

        console.log('User created successfully:', newUser);

        // cleanup
        await User.deleteOne({ id: newUser.id });
        console.log('User deleted (cleanup)');

        process.exit(0);
    } catch (error) {
        console.error('Creation failed:', error);
        process.exit(1);
    }
}

testCreation();
