const fs = require('fs');
const path = require('path');
const connectDB = require('../src/db/connect');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const SpecialOrder = require('../src/models/SpecialOrder');
const Taxonomy = require('../src/models/Taxonomy');
const Storage = require('../src/models/Storage');

const EXPORT_DIR = path.join(__dirname, '..', 'data', 'exports');

const importCollection = async (model, name, uniqueField) => {
    try {
        const filePath = path.join(EXPORT_DIR, `${name}.json`);
        if (!fs.existsSync(filePath)) {
            console.log(`Skipping ${name}: File not found.`);
            return;
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`Importing ${data.length} records for ${name}...`);

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

            await model.findOneAndUpdate(filter, item, { upsert: true, new: true });
            count++;
        }
        console.log(`Imported ${count} records for ${name}.`);
    } catch (error) {
        console.error(`Error importing ${name}:`, error.message);
    }
};

const runImport = async () => {
    try {
        await connectDB();
        console.log(`Starting Import from ${EXPORT_DIR}...`);

        // 1. Teams & Security
        await importCollection(User, 'users', 'id'); // Assuming 'id' is unique for User

        // 2. Active Catalog
        await importCollection(Product, 'products', 'id'); // Assuming 'id' is unique for Product

        // 3. Special Orders
        await importCollection(SpecialOrder, 'special_orders', 'id'); // Assuming 'id' is unique for Order

        // 4. Calculation Engine Settings
        await importCollection(Taxonomy, 'taxonomy', 'name');
        await importCollection(Storage, 'storage', 'key');

        console.log('Import completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Import failed:', err);
        process.exit(1);
    }
};

runImport();
