
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const dotenv = require('dotenv');

// Load env
const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wine-distributor';

async function injectDuplicate() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const TestItemCode = "TEST-DUP-001";
        const TestSupplier = "Test Supplier Verification";

        // Create Product 1
        await mongoose.connection.collection('products').insertOne({
            id: uuidv4(),
            itemCode: TestItemCode,
            supplier: TestSupplier,
            productName: "Test Product (Original)",
            bottleSize: "750ml",
            vintage: "2020",
            uploadDate: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-01')
        });

        // Create Product 2 (Duplicate)
        await mongoose.connection.collection('products').insertOne({
            id: uuidv4(),
            itemCode: TestItemCode, // Same Item Code
            supplier: TestSupplier, // Same Supplier
            productName: "Test Product (Duplicate)",
            bottleSize: "750ml",
            vintage: "2020",
            uploadDate: new Date(),
            updatedAt: new Date()
        });

        console.log(`Injected 2 duplicate products for ${TestItemCode} / ${TestSupplier}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

injectDuplicate();
