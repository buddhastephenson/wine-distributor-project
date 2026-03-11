require('ts-node').register({ transpileOnly: true });
const mongoose = require('mongoose');
require('dotenv').config();

async function testImport() {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/wine-distributor';
    await mongoose.connect(uri);

    const ProductServiceModule = require('./src/server/services/ProductService');
    const ProductService = ProductServiceModule.default;

    const supplierName = "Rosenthal Wine Merchant Test";
    const testCode = "TEST-DUP-1";

    console.log("Cleaning up previous test items...");
    await mongoose.connection.collection('products').deleteMany({ itemCode: testCode });

    // Step 1: Create Initial Product
    console.log("Creating initial product...");
    await ProductService.createProduct({
        itemCode: testCode,
        productName: "Original Test Wine",
        supplier: supplierName,
        producer: "Test Producer",
        fobCasePrice: 100
    });

    let count = await mongoose.connection.collection('products').countDocuments({ itemCode: testCode });
    console.log(`Products after initial create: ${count}`);

    // Step 2: Simulate Import with identical data but spaces
    console.log("Simulating import with trailing spaces...");
    const importPayload = [
        {
            itemCode: `${testCode} `,
            productName: "Updated Test Wine (Imported)",
            producer: "Test Producer updated",
            fobCasePrice: 150
        }
    ];

    try {
        const stats = await ProductService.bulkImport(importPayload, `${supplierName} `);
        console.log("Import Stats:", stats);
    } catch (e) {
        console.error("Bulk Import Failed (Expected if DB constraint caught it without Service trimming):", e.message);
    }

    // Step 3: Verify Deduplication
    const duplicates = await mongoose.connection.collection('products').find({ itemCode: testCode }).toArray();
    console.log(`Products after import: ${duplicates.length}`);
    duplicates.forEach(d => {
        console.log(`- ID: ${d._id}, Name: ${d.productName}, Price: ${d.fobCasePrice}, UploadDate: ${d.uploadDate}`);
    });

    if (duplicates.length === 1 && duplicates[0].productName === "Updated Test Wine (Imported)") {
        console.log("SUCCESS: Product was updated, not duplicated!");
    } else {
        console.log("FAILED: Duplicates were created, or product was not updated.");
    }

    process.exit(0);
}

testImport().catch(err => {
    console.error(err);
    process.exit(1);
});
