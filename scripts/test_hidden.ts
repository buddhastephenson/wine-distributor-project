import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProductService from '../src/server/services/ProductService';
import SpecialOrder from '../src/server/models/SpecialOrder';

dotenv.config();

async function testHiddenLogic() {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/wine-distributor';
    await mongoose.connect(uri);

    const supplierName = "Hidden Logic Test Supplier";
    const keptCode = "TEST-KEEP-1"; // Will stay on active order but not in import
    const deletedCode = "TEST-DEL-1"; // Will NOT be in order and NOT in import
    const updatedCode = "TEST-UPD-1"; // Will be in import

    console.log("Cleaning up previous test items...");
    await mongoose.connection.collection('products').deleteMany({ supplier: supplierName });
    await mongoose.connection.collection('specialorders').deleteMany({ supplier: supplierName });

    // Step 1: Create Initial Products
    console.log("Creating initial products...");
    await ProductService.createProduct({
        itemCode: keptCode,
        productName: "Kept Legacy Wine",
        supplier: supplierName,
        producer: "Test Producer",
        isHidden: false
    } as any);

    await ProductService.createProduct({
        itemCode: deletedCode,
        productName: "To Be Deleted Wine",
        supplier: supplierName,
        producer: "Test Producer",
        isHidden: false
    } as any);

    await ProductService.createProduct({
        itemCode: updatedCode,
        productName: "To Be Updated Wine",
        supplier: supplierName,
        producer: "Test Producer",
        isHidden: true // artificially set true to verify it un-hides on update
    } as any);

    // Step 2: Create Active Order for keptCode
    console.log("Creating active order to protect TEST-KEEP-1...");
    await SpecialOrder.create({
        itemCode: keptCode,
        supplier: supplierName,
        status: 'Pending',
        isArchived: false,
        productName: "Kept Legacy Wine (Order)",
        username: "testuser",
        id: "order-123"
    } as any);

    // Step 3: Simulate Import (omits KEEP and DEL, includes UPD and a NEW one)
    console.log("Simulating new import...");
    const importPayload = [
        {
            itemCode: updatedCode,
            productName: "Updated Wine (Imported)",
            supplier: supplierName,
            producer: "Test Producer"
        },
        {
            itemCode: "TEST-NEW-1",
            productName: "Brand New Wine (Imported)",
            supplier: supplierName,
            producer: "Test Producer"
        }
    ];

    const stats = await ProductService.bulkImport(importPayload as any, supplierName);
    console.log("Import Stats:", stats);

    // Step 4: Verify DB State directly
    const allDBProducts = await mongoose.connection.collection('products').find({ supplier: supplierName }).toArray();
    console.log(`Products in DB: ${allDBProducts.length}`);
    allDBProducts.forEach(p => {
        console.log(`- ${p.itemCode}: isHidden=${p.isHidden}, name=${p.productName}`);
    });

    // Step 5: Verify getAllProducts API filters correct items
    console.log("Testing getAllProducts()...");
    const catalogProducts = await ProductService.getAllProducts();
    const testCatalog = catalogProducts.filter((p: any) => p.supplier === supplierName);
    console.log(`Visible in Catalog: ${testCatalog.length}`);
    testCatalog.forEach((p: any) => console.log(`- ${p.itemCode}`));

    process.exit(0);
}

testHiddenLogic().catch(err => {
    console.error(err);
    process.exit(1);
});
