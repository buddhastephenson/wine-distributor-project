const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wine-distributor';

async function revertPassword() {
    try {
        await mongoose.connect(MONGODB_URI);

        const hashedPassword = await bcrypt.hash('password', 10);

        await mongoose.connection.db.collection('users').updateOne(
            { username: 'Trey' },
            { $set: { password: hashedPassword } }
        );
        console.log('Reverted Trey password to "password"');

        mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        mongoose.connection.close();
    }
}

revertPassword();
