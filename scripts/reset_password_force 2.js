const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    type: { type: String, required: true },
    email: { type: String },
    isSuperAdmin: { type: Boolean, default: false },
    vendors: { type: [String], default: [] }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function resetPassword() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wine-distributor');

        const hashedPassword = await bcrypt.hash('password', 10);

        // Update 'treys'
        let user = await User.findOne({ username: 'treys' });
        if (user) {
            user.password = hashedPassword;
            await user.save();
            console.log("Reset 'treys' password to 'password'.");
        } else {
            console.log("User 'treys' not found. Creating...");
            user = new User({
                username: 'treys',
                password: hashedPassword,
                type: 'admin',
                isSuperAdmin: true,
                email: 'treys@test.com'
            });
            await user.save();
            console.log("Created 'treys'.");
        }

        console.log('Done.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

resetPassword();
