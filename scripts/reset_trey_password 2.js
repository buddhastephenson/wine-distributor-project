const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function resetTreyPassword() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wine-distributor');

        const hashedPassword = await bcrypt.hash('password', 10);

        // Update 'Trey'
        const user = await User.findOne({ username: 'Trey' });
        if (user) {
            user.password = hashedPassword;
            await user.save();
            console.log("Successfully reset password for user 'Trey' to 'password'.");
        } else {
            console.log("User 'Trey' not found!");
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

resetTreyPassword();
