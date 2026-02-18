const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/wine-distributor';

const userSchema = new mongoose.Schema({
    type: String,
    isSuperAdmin: Boolean,
    vendors: [String]
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        // Find users who are type='admin' AND have vendors > 0
        const restrictedAdmins = await User.find({
            type: 'admin',
            vendors: { $exists: true, $not: { $size: 0 } }
        });

        console.log(`Found ${restrictedAdmins.length} users to migrate to 'vendor' type.`);

        for (const user of restrictedAdmins) {
            console.log(`Migrating User: ${user.username} (Current Type: ${user.type}) -> New Type: 'vendor'`);

            user.type = 'vendor';
            // We can keep isSuperAdmin: false (or remove it, but false is fine)
            // We keep vendors array as is (their portfolios)

            await user.save();
            console.log(`  - Success.`);
        }

        // Also check if any users have type 'vendor' but were somehow messed up? No need.

        console.log('--- Migration Complete ---');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
