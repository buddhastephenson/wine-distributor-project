import mongoose from 'mongoose';
import ProductService from './src/server/services/ProductService';
import User from './src/server/models/User';
import dotenv from 'dotenv';
dotenv.config();

const runTest = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wine-distributor');

        const testVendorName = "Diamond Wine Importers Debug";
        console.log(`Testing import with newVendorName: "${testVendorName}"`);

        // Check if user exists and delete if so
        await User.deleteOne({ username: testVendorName });

        // Mock products
        const products: any[] = [];

        // Call the service
        const result = await ProductService.bulkImport(products, 'Test Supplier', undefined, testVendorName);
        console.log('Import Result:', result);

        // Check user
        const user = await User.findOne({ username: testVendorName });
        if (user) {
            console.log('SUCCESS: User created:', user);
            // Cleanup
            await User.deleteOne({ username: testVendorName });
        } else {
            console.error('FAILURE: User NOT created.');
        }

        process.exit(0);
    } catch (e) {
        console.error('Error during test:', e);
        process.exit(1);
    }
};

runTest();
