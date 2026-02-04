const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const connectDB = require('../src/db/connect');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const SpecialOrder = require('../src/models/SpecialOrder');
const Taxonomy = require('../src/models/Taxonomy');

const DATA_DIR = path.join(__dirname, '..', 'data', 'persistence');

const migrateUsers = async () => {
    try {
        const usersData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'users.json'), 'utf8'));
        console.log(`Migrating ${usersData.length} users...`);

        for (const user of usersData) {
            await User.findOneAndUpdate(
                { id: user.id },
                user,
                { upsert: true, new: true }
            );
        }
        console.log('Users migration complete.');
    } catch (error) {
        console.error('Error migrating users:', error.message);
    }
};

const migrateProducts = async () => {
    try {
        const productFile = path.join(DATA_DIR, 'wine-products.json');
        if (!fs.existsSync(productFile)) {
            console.log('No wine-products.json found, skipping.');
            return;
        }
        const productsData = JSON.parse(fs.readFileSync(productFile, 'utf8'));
        console.log(`Migrating ${productsData.length} products...`);

        // Batch insert for performance might be better, but loop with upsert is safer for idempotency
        let count = 0;
        for (const product of productsData) {
            await Product.findOneAndUpdate(
                { id: product.id },
                product,
                { upsert: true, new: true }
            );
            count++;
            if (count % 100 === 0) console.log(`Processed ${count} products...`);
        }
        console.log('Products migration complete.');
    } catch (error) {
        console.error('Error migrating products:', error.message);
    }
};

const migrateSpecialOrders = async () => {
    try {
        const ordersFile = path.join(DATA_DIR, 'wine-special-orders.json');
        if (!fs.existsSync(ordersFile)) {
            console.log('No wine-special-orders.json found, skipping.');
            return;
        }
        const ordersData = JSON.parse(fs.readFileSync(ordersFile, 'utf8'));
        const userKeys = Object.keys(ordersData);
        let count = 0;
        console.log(`Found orders for ${userKeys.length} users. Migrating...`);

        for (const username of userKeys) {
            const userOrders = ordersData[username];
            for (const order of userOrders) {
                // Ensure order has the username associated
                const orderWithUser = { ...order, username };
                await SpecialOrder.findOneAndUpdate(
                    { id: order.id },
                    orderWithUser,
                    { upsert: true, new: true }
                );
                count++;
            }
        }
        console.log(`Special Orders migration complete. Processed ${count} items.`);
    } catch (error) {
        console.error('Error migrating special orders:', error.message);
    }
};

const migrateTaxonomy = async () => {
    try {
        const taxFile = path.join(DATA_DIR, 'taxonomy.json');
        if (!fs.existsSync(taxFile)) {
            console.log('No taxonomy.json found, skipping.');
            return;
        }
        const taxData = JSON.parse(fs.readFileSync(taxFile, 'utf8'));
        console.log('Migrating taxonomy...');

        await Taxonomy.findOneAndUpdate(
            { name: 'main_taxonomy' },
            { name: 'main_taxonomy', data: taxData },
            { upsert: true, new: true }
        );
        console.log('Taxonomy migration complete.');
    } catch (error) {
        console.error('Error migrating taxonomy:', error.message);
    }
}

const runMigration = async () => {
    await connectDB();

    await migrateUsers();
    await migrateTaxonomy();
    await migrateSpecialOrders();
    await migrateProducts();

    console.log('Migration finished.');
    process.exit(0);
};

runMigration();
