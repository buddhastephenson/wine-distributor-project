const mongoose = require('mongoose');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    email: { type: String },
    isSuperAdmin: { type: Boolean, default: false },
    vendors: { type: [String], default: [] }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wine-distributor');

        const users = await User.find({}, 'username type email isSuperAdmin');
        console.log('--- User Accounts ---');
        users.forEach(u => {
            console.log(`Username: ${u.username} | Type: ${u.type} | SuperAdmin: ${u.isSuperAdmin || false} | Email: ${u.email}`);
        });
        console.log('---------------------');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

listUsers();
