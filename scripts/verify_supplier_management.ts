
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

// Load env
const envPath = path.join(process.cwd(), '.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.warn('MONGODB_URI not found in .env at ' + envPath);
    console.warn('Using fallback: mongodb://localhost:27017/wine-distributor');
}

const FINAL_URI = MONGODB_URI || 'mongodb://localhost:27017/wine-distributor';

// We need to register ts-node to require .ts files 
// BUT if we are running with ts-node already, we can require .ts files.
// However, if we encounter issues, we might need to point to specific files.
// Let's try requiring the TS files directly. 
// Note: This relies on ts-node handling the require hook.

const Product = require('../src/server/models/Product').default || require('../src/server/models/Product');
const SpecialOrder = require('../src/server/models/SpecialOrder').default || require('../src/server/models/SpecialOrder');
const ProductService = require('../src/server/services/ProductService').default || require('../src/server/services/ProductService');

const TEST_SUPPLIER_OLD = "Test_Supplier_A";
const TEST_SUPPLIER_NEW = "Test_Supplier_B";
const ITEM_CODE = "TEST-SUP-MANAGEMENT";

/**
 * Verification Steps:
 * 1. Create a product with Supplier A.
 * 2. Rename Supplier A -> Supplier B. Verify product supplier.
 * 3. Delete Supplier B. Verify product deleted.
 */

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(FINAL_URI);
        console.log('Connected.');

        // 0. Cleanup
        await Product.deleteMany({ itemCode: ITEM_CODE });
        console.log('Cleaned up previous test data.');

        // 1. Setup Data
        console.log(`Creating product for supplier: ${TEST_SUPPLIER_OLD}`);
        const product = await Product.create({
            id: uuidv4(),
            itemCode: ITEM_CODE,
            productName: "Test Product",
            supplier: TEST_SUPPLIER_OLD,
            fobCasePrice: 100,
            vendor: new mongoose.Types.ObjectId(), // Fake vendor ID
            producer: "Test Producer",
            variety: "Red",
            vintage: "2020",
            region: "Test Region",
            country: "Test Country",
            bottleSize: "750ml",
            caseSize: "12",
            txtFob: "100"
        });

        console.log('Created product:', product.id);

        // 2. Verify Stats
        const statsBefore = await ProductService.getSupplierStats();
        // statsBefore is array of { supplier, count }
        const supplierStat = statsBefore.find((s: any) => s.supplier === TEST_SUPPLIER_OLD);

        if (!supplierStat || supplierStat.count < 1) {
            throw new Error(`Stats verification failed. Expected at least 1 for ${TEST_SUPPLIER_OLD}, got ${supplierStat?.count}`);
        }
        console.log('Stats Verified: Found Test Supplier.');

        // 3. Rename
        console.log(`Renaming ${TEST_SUPPLIER_OLD} -> ${TEST_SUPPLIER_NEW}...`);
        const renameResult = await ProductService.renameSupplier(TEST_SUPPLIER_OLD, TEST_SUPPLIER_NEW);
        console.log('Rename Result:', renameResult);

        if (renameResult.productsUpdated < 1) {
            throw new Error('Rename failed: No products updated.');
        }

        // Verify product
        const updatedProduct = await Product.findOne({ itemCode: ITEM_CODE });
        if (updatedProduct?.supplier !== TEST_SUPPLIER_NEW) {
            throw new Error(`Rename verification failed. Expected ${TEST_SUPPLIER_NEW}, got ${updatedProduct?.supplier}`);
        }
        console.log('Rename Verified: Product updated.');

        // 4. Delete
        console.log(`Deleting supplier ${TEST_SUPPLIER_NEW}...`);
        const deleteResult = await ProductService.deleteSupplier(TEST_SUPPLIER_NEW);
        console.log('Delete Result:', deleteResult);

        if (deleteResult.productsDeleted < 1) {
            throw new Error('Delete failed: No products deleted.');
        }

        // Verify deletion
        const deletedProduct = await Product.findOne({ itemCode: ITEM_CODE });
        if (deletedProduct) {
            throw new Error('Delete verification failed. Product still exists.');
        }
        console.log('Delete Verified: Product removed.');

        console.log('--- SUPPPLIER MANAGEMENT VERIFICATION SUCCESS ---');

    } catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

run();
