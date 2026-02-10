const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    type: { type: String, required: true },
    email: { type: String },
    isSuperAdmin: { type: Boolean, default: false }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seedAdmin() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wine-distributor');

        const hashedPassword = await bcrypt.hash('password', 10);

        // Update/Create 'treys'
        let user = await User.findOne({ username: 'treys' });
        if (user) {
            user.type = 'admin';
            user.isSuperAdmin = true;
            user.password = hashedPassword;
            await user.save();
            console.log("Updated 'treys' to admin.");
        } else {
            user = new User({
                username: 'treys',
                password: hashedPassword,
                type: 'admin',
                isSuperAdmin: true
            });
            await user.save();
            console.log("Created 'treys' as admin.");
        }

        // Update/Create 'treystephenson'
        let customer = await User.findOne({ username: 'treystephenson' });
        if (!customer) {
            customer = new User({
                username: 'treystephenson',
                password: hashedPassword,
                type: 'customer'
            });
            await customer.save();
            console.log("Created 'treystephenson' customer.");
        } else {
            customer.password = hashedPassword;
            await customer.save();
            console.log("Updated 'treystephenson' password.");
        }

        console.log('Done.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

seedAdmin();
