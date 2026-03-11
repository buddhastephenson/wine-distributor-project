
import mongoose from 'mongoose';
import User from '../src/server/models/User';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aoc-wines');
        console.log('Connected to MongoDB');

        const usersToCheck = ['treystephenson', 'mattcory'];

        for (const username of usersToCheck) {
            const user = await User.findOne({ username });
            if (user) {
                console.log(`User '${username}' found:`, user);
            } else {
                console.log(`User '${username}' NOT found.`);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Error checking users:', error);
        process.exit(1);
    }
};

checkUsers();
