const mongoose = require('mongoose');

// Need to define schema if not using TS models directly or just use loose schema
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    type: String,
    vendors: [String]
}, { strict: false });

const User = mongoose.model('User', userSchema);

const MONGO_URI = 'mongodb://127.0.0.1:27017/wine-distributor';

async function checkUser() {
    try {
        await mongoose.connect(MONGO_URI);

        console.log('Connected to DB. Searching for users...');
        const users = await User.find({
            $or: [
                { username: { $regex: 'Rosenthal', $options: 'i' } },
                { email: { $regex: 'Rosenthal', $options: 'i' } },
                { vendors: 'Rosenthal Wine Merchant' }
            ]
        });

        if (users.length === 0) {
            console.log('No matching users found.');
        } else {
            console.log('Found Users:', JSON.stringify(users, null, 2));
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

checkUser();
