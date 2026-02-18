const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/wine-distributor';

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const users = await User.find({
            username: /Matt/i
        });

        console.log('--- Debug User Permissions ---');
        if (users.length === 0) {
            console.log('No user found matching "Matt"');
        }

        users.forEach(u => {
            console.log(`User: ${u.username}`);
            console.log(`  _id: ${u._id}`);
            console.log(`  id (field): ${u.get('id')}`); // Get specific field, ignore virtual
            console.log(`  id (virtual): ${u.id}`);
            console.log(`  Type: '${u.type}'`);
            console.log(`  IsSuperAdmin: ${u.isSuperAdmin}`);
            console.log(`  Vendors Array: ${JSON.stringify(u.vendors)}`);
            if (u.vendors && u.vendors.length > 0) {
                u.vendors.forEach(v => {
                    console.log(`    Vendor: "${v}" (Length: ${v.length})`);
                    for (let i = 0; i < v.length; i++) {
                        process.stdout.write(v.charCodeAt(i) + " ");
                    }
                    console.log("\n");
                });
            }
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
