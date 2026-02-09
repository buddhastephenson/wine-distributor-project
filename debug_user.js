const mongoose = require('mongoose');
const User = require('./src/server/models/User').default;

const MONGO_URI = 'mongodb://127.0.0.1:27017/wine-distributor';

async function checkUser() {
    try {
        await mongoose.connect(MONGO_URI);

        // Find users that might be the one in question
        const users = await User.find({
            $or: [
                { username: { $regex: 'Rosenthal', $options: 'i' } },
                { email: { $regex: 'Rosenthal', $options: 'i' } },
                { vendors: { $in: ['Rosenthal Wine Merchant'] } }
            ]
        });

        console.log('Found Users:', JSON.stringify(users, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkUser();
