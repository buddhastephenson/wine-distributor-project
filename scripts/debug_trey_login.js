const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wine-distributor';

async function debugTrey() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await mongoose.connection.db.collection('users').find({ username: 'Trey' }).toArray();
        if (users.length === 0) {
            console.log('User Trey not found');
            return;
        }

        const trey = users[0];
        console.log(`Found User: ${trey.username}`);
        console.log(`Stored Hash: ${trey.password}`);

        if (!trey.password) {
            console.log('Error: No password set');
        } else {
            const isMatch = await bcrypt.compare('password', trey.password);
            console.log(`Comparing 'password' with stored hash: ${isMatch}`);

            const isMatchTrey = await bcrypt.compare('Trey', trey.password);
            console.log(`Comparing 'Trey' with stored hash: ${isMatchTrey}`);
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        mongoose.connection.close();
    }
}

debugTrey();
