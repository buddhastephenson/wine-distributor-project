const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wine-distributor';

async function simulateReset() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find Trey
        const user = await mongoose.connection.db.collection('users').findOne({ username: 'Trey' });
        if (!user) {
            console.log('User Trey not found');
            return;
        }

        // Generate Token
        // Using crypto directly as AuthService uses specific methods
        const token = crypto.randomBytes(20).toString('hex');
        const tokenExpiry = Date.now() + 3600000; // 1 hour

        await mongoose.connection.db.collection('users').updateOne(
            { username: 'Trey' },
            { $set: { resetToken: token, resetPasswordExpires: tokenExpiry } }
        );

        console.log('--- Mock Reset Link ---');
        console.log(`http://localhost:3000/reset-password?token=${token}`);
        console.log('-----------------------');

        mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        mongoose.connection.close();
    }
}

simulateReset();
