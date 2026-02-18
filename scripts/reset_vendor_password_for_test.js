const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb://localhost:27017/wine-distributor';

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    type: String,
    vendors: [String]
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const username = 'Dalla Terra';
        // Case-insensitive search
        const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });

        if (!user) {
            console.log(`User ${username} not found!`);
            // List all vendor users
            const users = await User.find({ type: 'vendor' }, 'username type vendors');
            console.log('Available vendor users:', users.map(u => `${u.username} (${u.type}) - Vendors: ${u.vendors}`));
            process.exit(1);
        }

        console.log(`Found user: ${user.username}, Type: ${user.type}, Vendors: ${user.vendors}`);

        const hashedPassword = await bcrypt.hash('password123', 10);
        user.password = hashedPassword;
        await user.save();

        console.log('Password reset to: password123');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
