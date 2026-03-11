
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const checkUsers = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aoc-wines';
        console.log(`Connecting to MongoDB at ${uri}...`);
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('users');

        const usersToCheck = ['treystephenson', 'mattcory', 'Trey', 'Matt Cory'];

        for (const username of usersToCheck) {
            const user = await collection.findOne({ username });
            if (user) {
                console.log(`User '${username}' FOUND.`);
            } else {
                console.log(`User '${username}' NOT FOUND.`);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Error checking users:', error);
        process.exit(1);
    }
};

checkUsers();
