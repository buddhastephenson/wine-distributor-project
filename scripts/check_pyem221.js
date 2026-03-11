const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/wine-distributor';
    await mongoose.connect(uri);

    const productSchema = new mongoose.Schema({}, { strict: false, collection: 'products' });
    const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

    const products = await Product.find({ itemCode: 'PYEM221' }).lean();
    console.log("Documents with itemCode PYEM221:", products.length);
    products.forEach(p => {
        console.log(`\n--- Product ${p._id} ---`);
        console.log(`id (uuid string): "${p.id}"`);
        console.log(`itemCode: "${p.itemCode}"`);
        console.log(`supplier: "${p.supplier}"`);
        console.log(`vendor: "${p.vendor}"`);
        console.log(`uploadDate: ${p.uploadDate}`);
        console.log(`extendedData:`, JSON.stringify(p.extendedData));
        console.log(`raw keys:`, Object.keys(p).join(', '));
    });

    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
