const mongoose = require('mongoose');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    type: { type: String, enum: ['admin', 'customer'], default: 'customer' },
    vendors: { type: [String], default: [] },
    email: { type: String, required: true, unique: true },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wine-distributor');
        const users = await User.find({});
        console.log('--- ALL USERS ---');
        users.forEach(u => {
            console.log(`ID: ${u.id} | Username: ${u.username} | Type: ${u.type} | Vendors: ${u.vendors.join(', ')}`);
        });
        console.log('-----------------');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUsers();
