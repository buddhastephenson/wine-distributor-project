const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const EXPORT_DIR = path.join(__dirname, '..', 'data', 'exports');

const importCollection = async (db, name, uniqueField) => {
    try {
        const filePath = path.join(EXPORT_DIR, `${name}.json`);
        if (!fs.existsSync(filePath)) {
            console.log(`Skipping ${name}: File not found.`);
            return;
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`Importing ${data.length} records for ${name}...`);

        const collection = db.collection(name);

        let count = 0;
        for (const item of data) {
            const filter = {};
            if (uniqueField) {
                filter[uniqueField] = item[uniqueField];
            } else {
                // Fallback for Storage key or Taxonomy name
                if (name === 'storage') filter.key = item.key;
                if (name === 'taxonomy') filter.name = item.name;
            }

            // Use separate update operator to avoid replacing _id if it exists in item but not in filter
            // actually replaceOne with upsert is probably what we want, or updateOne with $set
            // The exports might contain _id. If we want to preserve it, we should use it.
            // If the item has _id, we should probably remove it from the update payload if we are using a different filter
            // BUT for restoration, we want to restore everything including _id if possible.

            // However, inserting with _id might conflict if we use a different filter.
            // Let's use updateOne with $set, and include everything.
            // If _id is present in item, mongo might complain if it differs from existing doc's _id (which shouldn't happen if uniqueField matches).

            const { _id, ...docWithoutId } = item;
            // If we are restoring, we might want to force the _id too if it's new.

            await collection.updateOne(filter, { $set: item }, { upsert: true });
            count++;
        }
        console.log(`Imported ${count} records for ${name}.`);
    } catch (error) {
        console.error(`Error importing ${name}:`, error.message);
    }
};

const runImport = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aoc-wines';
        console.log(`Connecting to MongoDB at ${uri}...`);
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;

        console.log(`Starting Import from ${EXPORT_DIR}...`);

        // 1. Users
        await importCollection(db, 'users', 'id');

        // 2. Products
        await importCollection(db, 'products', 'id');

        // 3. Special Orders
        await importCollection(db, 'special_orders', 'id');

        // 4. Taxonomy
        await importCollection(db, 'taxonomy', 'name');

        // 5. Storage
        await importCollection(db, 'storage', 'key');

        console.log('Import completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Import failed:', err);
        process.exit(1);
    }
};

runImport();

