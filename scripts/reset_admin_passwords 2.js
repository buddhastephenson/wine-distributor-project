const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wine-distributor';

async function resetPasswords() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const hashedPassword = await bcrypt.hash('password', 10);
        console.log(`Generated Hash: ${hashedPassword}`);

        // Update Trey
        const resultTrey = await mongoose.connection.db.collection('users').updateOne(
            { username: 'Trey' },
            { $set: { password: hashedPassword } }
        );
        console.log(`Updated Trey: ${resultTrey.modifiedCount}`);

        // Update Matt Cory
        const resultMatt = await mongoose.connection.db.collection('users').updateOne(
            { username: 'Matt Cory' },
            { $set: { password: hashedPassword } }
        );
        console.log(`Updated Matt Cory: ${resultMatt.modifiedCount}`);

        mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        mongoose.connection.close();
    }
}

resetPasswords();
