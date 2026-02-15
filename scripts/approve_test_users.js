const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/wine-distributor')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error(err));

const UserSchema = new mongoose.Schema({
    username: String,
    status: { type: String, enum: ['active', 'pending', 'rejected'], default: 'pending' }
}, { strict: false });

const User = mongoose.model('User', UserSchema);

async function approveUsers() {
    try {
        const result = await User.updateMany(
            { username: { $in: ['TestVendor', 'TestRep'] } },
            { $set: { status: 'active' } }
        );
        console.log(`Approved ${result.modifiedCount} users.`);
    } catch (error) {
        console.error('Error approving users:', error);
    } finally {
        mongoose.disconnect();
    }
}

approveUsers();
