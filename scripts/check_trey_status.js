const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wine-distributor';

async function checkTrey() {
    try {
        await mongoose.connect(MONGODB_URI);
        const user = await mongoose.connection.db.collection('users').findOne({ username: 'Trey' });

        if (user) {
            console.log(`User: ${user.username}`);
            console.log(`Password Hash: ${user.password}`);
            console.log(`Reset Token: ${user.resetToken}`);
            console.log(`Updated At: ${user.updatedAt}`); // If timestamp exists
        } else {
            console.log('User Trey not found');
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkTrey();
