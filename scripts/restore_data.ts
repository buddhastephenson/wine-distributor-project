
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import connectDB from '../src/server/utils/db';
import User from '../src/server/models/User';
import Product from '../src/server/models/Product';
import SpecialOrder from '../src/server/models/SpecialOrder';
import Taxonomy from '../src/server/models/Taxonomy';
import Storage from '../src/server/models/Storage';

const EXPORT_DIR = path.join(__dirname, '../data/exports');

const importCollection = async (model: any, name: string, uniqueField: string) => {
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
            const filter: any = {};
            if (uniqueField) {
                filter[uniqueField] = item[uniqueField];
            } else {
                if (name === 'storage') filter.key = item.key;
                if (name === 'taxonomy') filter.name = item.name;
            }

            // Remove _id to avoid casting errors if they differ in format or let mongo generate new ones if needed, 
            // BUT we probably want to keep them if they are valid ObjectIds.
            // The exports likely have _id string or object. 
            // If we are restoring, we might want to keep the IDs if they are valid.
            // For now, let's use findOneAndUpdate with upsert. 

            await model.findOneAndUpdate(filter, item, { upsert: true, new: true });
            count++;
        }
        console.log(`Imported ${count} records for ${name}.`);
    } catch (error: any) {
        console.error(`Error importing ${name}:`, error.message);
    }
};

const runRestore = async () => {
    try {
        await connectDB();
        console.log(`Starting Restore from ${EXPORT_DIR}...`);

        // 1. Users
        await importCollection(User, 'users', 'id');

        // 2. Products
        await importCollection(Product, 'products', 'id');

        // 3. Special Orders
        await importCollection(SpecialOrder, 'special_orders', 'id');

        // 4. Taxonomy
        await importCollection(Taxonomy, 'taxonomy', 'name');

        // 5. Storage
        await importCollection(Storage, 'storage', 'key');

        console.log('Restore completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Restore failed:', err);
        process.exit(1);
    }
};

runRestore();
