const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/wine-distributor';

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const admins = await User.find({ type: 'admin' });

        console.log('--- All Admin Users ---');
        admins.forEach(u => {
            console.log(`User: ${u.username}`);
            console.log(`  Type: ${u.type}`);
            console.log(`  isSuperAdmin: ${u.isSuperAdmin}`);
            console.log(`  vendors: ${JSON.stringify(u.vendors)}`);
            console.log('-------------------------');
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
