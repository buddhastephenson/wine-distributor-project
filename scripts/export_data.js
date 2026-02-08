const fs = require('fs');
const path = require('path');
const connectDB = require('../src/db/connect');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const SpecialOrder = require('../src/models/SpecialOrder');
const Taxonomy = require('../src/models/Taxonomy');
const Storage = require('../src/models/Storage'); // For calculator settings/templates

const EXPORT_DIR = path.join(__dirname, '..', 'data', 'exports');

// Ensure export directory exists
if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

const exportCollection = async (model, name) => {
    try {
        console.log(`Exporting ${name}...`);
        const data = await model.find({}, '-_id -__v').lean();
        const filename = `${name}.json`;
        const filePath = path.join(EXPORT_DIR, filename);

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`Saved ${data.length} records to ${filename}`);
    } catch (error) {
        console.error(`Error exporting ${name}:`, error.message);
    }
};

const runExport = async () => {
    try {
        await connectDB();
        console.log(`Starting Export to ${EXPORT_DIR}...`);

        // 1. Teams & Security
        await exportCollection(User, 'users');

        // 2. Active Catalog
        await exportCollection(Product, 'products');

        // 3. Special Orders
        await exportCollection(SpecialOrder, 'special_orders');

        // 4. Calculation Engine Settings
        // Taxonomy (Main tree)
        await exportCollection(Taxonomy, 'taxonomy');
        // Storage (Templates, other config keys if any)
        // We filter Storage to only relevant keys if possible, or dump all for now
        await exportCollection(Storage, 'storage');

        console.log('Export completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Export failed:', err);
        process.exit(1);
    }
};

runExport();
