const fs = require('fs');
const path = require('path');
const connectDB = require('../src/db/connect');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const SpecialOrder = require('../src/models/SpecialOrder');
const Taxonomy = require('../src/models/Taxonomy');

const BACKUP_DIR = path.join(__dirname, '..', 'data', 'persistence');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPrefix = `backup_${timestamp}`;

const backupCollection = async (model, name) => {
    try {
        console.log(`Backing up ${name}...`);
        const data = await model.find({}, '-_id -__v').lean();
        const filename = `${backupPrefix}_${name}.json`;
        const filePath = path.join(BACKUP_DIR, filename);

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`Saved ${data.length} records to ${filename}`);
        return filename;
    } catch (error) {
        console.error(`Error backing up ${name}:`, error.message);
        throw error;
    }
};

const runBackup = async () => {
    try {
        await connectDB();
        console.log(`Starting backup at ${timestamp}...`);

        await backupCollection(User, 'users');
        await backupCollection(Product, 'products');
        await backupCollection(SpecialOrder, 'special_orders');

        // Taxonomy is a single document in strict mode, but we can dump the whole collection or just the main one
        const taxonomy = await Taxonomy.findOne({ name: 'main_taxonomy' }).lean();
        if (taxonomy) {
            const filename = `${backupPrefix}_taxonomy.json`;
            fs.writeFileSync(path.join(BACKUP_DIR, filename), JSON.stringify(taxonomy.data, null, 2));
            console.log(`Saved taxonomy to ${filename}`);
        } else {
            console.log('No taxonomy found to backup.');
        }

        console.log('Backup completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Backup failed:', err);
        process.exit(1);
    }
};

runBackup();
