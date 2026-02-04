const mongoose = require('mongoose');
const connectDB = require('../src/db/connect');
const Product = require('../src/models/Product');

const dropIndex = async () => {
    await connectDB();
    try {
        await Product.collection.dropIndex('itemCode_1');
        console.log('Index itemCode_1 dropped successfully');
    } catch (error) {
        console.log('Error dropping index (it might not exist):', error.message);
    }
    process.exit();
};

dropIndex();
