const mongoose = require('mongoose');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    type: { type: String, enum: ['admin', 'customer'], default: 'customer' },
    vendors: { type: [String], default: [] },
    email: { type: String, required: true, unique: true },
    accessRevoked: { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function fixVendor() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wine-distributor');

        const username = "Diamond Wine Importers";

        // 1. Check if exists
        let user = await User.findOne({ username });
        if (user) {
            console.log('User already exists:', user.username, user.type);
            if (user.type !== 'admin') {
                console.log('Promoting to admin...');
                user.type = 'admin';
                await user.save();
                console.log('Promoted.');
            }
        } else {
            console.log('User does not exist. Creating...');
            const sanitizedUsername = username.replace(/[^a-zA-Z0-9]/g, '');
            const dummyEmail = `${sanitizedUsername}-${Date.now()}@placeholder.local`;

            user = await User.create({
                id: `user-${Date.now()}`,
                username,
                password: username, // simplistic password
                type: 'admin', // Create directly as admin
                email: dummyEmail,
                vendors: []
            });
            console.log('Created user:', user);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixVendor();
