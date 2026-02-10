const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/admin';

async function listAllUsersEverywhere() {
    console.log(`Connecting to localhost...`);

    try {
        const conn = await mongoose.connect(MONGO_URI);

        const admin = conn.connection.db.admin();
        const result = await admin.listDatabases();

        console.log('Databases found:', result.databases.map(d => d.name).join(', '));

        let totalUsers = 0;

        for (const dbInfo of result.databases) {
            const dbName = dbInfo.name;
            if (['admin', 'local', 'config'].includes(dbName)) continue;

            console.log(`\n--- Checking Database: ${dbName} ---`);

            const db = conn.connection.useDb(dbName);
            const collection = db.collection('users');

            const users = await collection.find({}).toArray();

            if (users.length === 0) {
                console.log('   (No users found)');
            } else {
                users.forEach(u => {
                    console.log(`   User: ${u.username} | Email: ${u.email} | Role: ${u.type} | ID: ${u._id}`);
                    totalUsers++;
                });
            }
        }

        console.log(`\nTotal Users Found: ${totalUsers}`);
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listAllUsersEverywhere();
