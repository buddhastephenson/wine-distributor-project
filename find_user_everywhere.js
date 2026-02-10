const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/admin'; // Connect to admin to list DBs

async function findUserEverywhere(targetUsername) {
    if (!targetUsername) {
        console.log('Usage: node find_user_everywhere.js "Username"');
        process.exit(1);
    }

    console.log(`Connecting to localhost...`);

    try {
        const conn = await mongoose.connect(MONGO_URI);

        // List all databases
        const admin = conn.connection.db.admin();
        const result = await admin.listDatabases();

        console.log('Databases found:', result.databases.map(d => d.name).join(', '));

        let found = false;

        for (const dbInfo of result.databases) {
            const dbName = dbInfo.name;
            if (['admin', 'local', 'config'].includes(dbName)) continue;

            console.log(`Checking database: ${dbName}...`);

            // Switch to this DB
            const db = conn.connection.useDb(dbName);
            const collection = db.collection('users');

            const user = await collection.findOne({ username: { $regex: new RegExp(`^${targetUsername}$`, 'i') } });

            if (user) {
                console.log('✅ FOUND USER!');
                console.log(`   Database: ${dbName}`);
                console.log(`   ID: ${user._id}`);
                console.log(`   Username: ${user.username}`);
                console.log(`   Role: ${user.type}`);
                found = true;
            }
        }

        if (!found) {
            console.log('❌ User not found in ANY local database.');
            console.log('Possible reasons:');
            console.log('1. The app connects to a REMOTE database (e.g. MongoDB Atlas). check .env');
            console.log('2. The username spelling is different.');
        }

        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

const target = process.argv[2] || 'Dalla Terra';
findUserEverywhere(target);
