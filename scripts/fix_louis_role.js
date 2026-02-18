const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/wine-distributor';

const userSchema = new mongoose.Schema({
    username: String,
    type: String,
    isSuperAdmin: Boolean,
    vendors: [String]
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const searchPattern = /Louis/i;
        const user = await User.findOne({ username: searchPattern });

        if (!user) {
            console.log('No user found matching "Louis"');
            // Try to find by vendor assignment
            const usersWithVendors = await User.find({ vendors: { $in: [/Louis/i] } });
            if (usersWithVendors.length > 0) {
                console.log(`Found ${usersWithVendors.length} users with "Louis" in vendors list.`);
                // Update the first one
                await updateUser(usersWithVendors[0]);
            } else {
                console.log('No users found with "Louis" in vendors list either.');
            }
        } else {
            await updateUser(user);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

async function updateUser(user) {
    console.log(`Found User: ${user.username}`);
    console.log(`Current Role: ${user.type}`);
    console.log(`Current Vendors: ${JSON.stringify(user.vendors)}`);

    if (user.vendors && user.vendors.length > 0) {
        user.type = 'admin'; // "Vendor" role in this system is Restricted Admin
        user.isSuperAdmin = false;
        await user.save();
        console.log(`Updated user ${user.username} to type 'admin' (Restricted Vendor).`);
        console.log('They should now see ONLY products for:', user.vendors);
    } else {
        console.log('User has no vendors assigned! Cannot promote to restricted vendor.');
        console.log('Please assign a Price List in the Admin Settings first.');
    }
}

run();
