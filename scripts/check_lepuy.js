const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/wine-distributor';
    await mongoose.connect(uri);

    const productSchema = new mongoose.Schema({}, { strict: false, collection: 'products' });
    const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

    const products = await Product.find({ producer: /LE PUY/i }).lean();
    console.log("Documents with producer LE PUY:", products.length);
    products.forEach(p => {
        console.log(`\n--- Product ${p._id} ---`);
        console.log(`id: "${p.id}"`);
        console.log(`itemCode: "${p.itemCode}"`);
        console.log(`supplier: "${p.supplier}"`);
        console.log(`vendor: "${p.vendor}"`);
        console.log(`fobCasePrice: ${p.fobCasePrice}`);
        console.log(`uploadDate: ${p.uploadDate}`);
    });

    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
