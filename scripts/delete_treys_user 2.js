const mongoose = require('mongoose');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    isSuperAdmin: { type: Boolean, default: false }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function deleteTreys() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wine-distributor');

        const result = await User.deleteOne({ username: 'treys' });

        if (result.deletedCount > 0) {
            console.log("Successfully deleted user 'treys'.");
        } else {
            console.log("User 'treys' not found.");
        }

        // Optional: Check for other invalid states
        const invalidSupers = await User.find({ type: 'customer', isSuperAdmin: true });
        if (invalidSupers.length > 0) {
            console.log('WARNING: Found other Customer Super Admins:', invalidSupers.map(u => u.username));
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

deleteTreys();
