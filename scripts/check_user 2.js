const mongoose = require('mongoose');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
    username: String,
    type: String,
    email: String,
    vendors: [String]
}, { strict: false });

const User = mongoose.model('User', UserSchema);

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wine-distributor');
        const user = await User.findOne({ username: 'treystephenson' });
        console.log('User treystephenson:', user);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkUser();
