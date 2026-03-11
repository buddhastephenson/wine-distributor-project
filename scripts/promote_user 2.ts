
import mongoose from 'mongoose';
import User from '../src/server/models/User';
import connectDB from '../src/server/utils/db';
import dotenv from 'dotenv';
dotenv.config();

const promoteUser = async () => {
    await connectDB();
    const username = 'tester2';
    const user = await User.findOne({ username });
    if (user) {
        user.type = 'admin';
        await user.save();
        console.log(`Promoted ${username} to admin`);
    } else {
        console.log(`User ${username} not found`);
    }
    process.exit();
};

promoteUser();
