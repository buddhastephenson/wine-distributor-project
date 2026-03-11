const mongoose = require('mongoose');

// Default to the same fallback as the app
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wine-distributor';

async function checkUser(targetUsername) {
    if (!targetUsername) {
        console.log('Usage: node check_user_status.js "Username"');
        process.exit(1);
    }

    console.log(`Connecting to ${MONGO_URI}...`);

    try {
        await mongoose.connect(MONGO_URI);

        const UserSchema = new mongoose.Schema({
            username: String,
            type: String,
            vendors: [String]
        }, { strict: false });

        const User = mongoose.model('User', UserSchema);

        const user = await User.findOne({ username: { $regex: new RegExp(`^${targetUsername}$`, 'i') } });

        if (!user) {
            console.log(`❌ User "${targetUsername}" NOT FOUND.`);
        } else {
            console.log('--------------------------------------------------');
            console.log(`✅ User Found: ${user.username}`);
            console.log(`   ID: ${user._id}`);
            console.log(`   Role: ${user.type}`);
            console.log(`   Vendors: ${JSON.stringify(user.vendors)}`);
            console.log('--------------------------------------------------');

            if (user.type !== 'vendor') {
                console.log('⚠️  WARNING: Role is NOT vendor!');
            } else {
                console.log('looks correct.');
            }
        }
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

const target = process.argv[2] || 'Dalla Terra';
checkUser(target);
