const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wine-distributor';

async function checkStats() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const userCount = await mongoose.connection.db.collection('users').countDocuments();
        const productCount = await mongoose.connection.db.collection('products').countDocuments();
        const orderCount = await mongoose.connection.db.collection('specialorders').countDocuments();

        console.log('--- Database Stats ---');
        console.log(`Users: ${userCount}`);
        console.log(`Products: ${productCount}`);
        console.log(`Special Orders: ${orderCount}`);
        console.log('----------------------');

        if (userCount > 0) {
            const users = await mongoose.connection.db.collection('users').find({}, { projection: { username: 1, type: 1, email: 1 } }).toArray();
            console.log('Users found:', users.map(u => `${u.username} (${u.type})`));
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('Error checking stats:', error);
        mongoose.connection.close();
    }
}

checkStats();
