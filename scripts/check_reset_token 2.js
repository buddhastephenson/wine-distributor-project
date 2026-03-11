const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wine-distributor';

async function checkResetToken() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await mongoose.connection.db.collection('users').find({ username: 'Trey' }).toArray();
        if (users.length === 0) {
            console.log('User Trey not found');
            return;
        }

        const trey = users[0];
        console.log(`User: ${trey.username}`);
        console.log(`Reset Token: ${trey.resetToken}`);
        console.log(`Reset Token Expiry: ${trey.resetPasswordExpires}`);
        console.log(`Current Time: ${new Date()}`);

        mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        mongoose.connection.close();
    }
}

checkResetToken();
