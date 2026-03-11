const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/wine-distributor';
    await mongoose.connect(uri);

    const productSchema = new mongoose.Schema({}, { strict: false, collection: 'products' });
    const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

    const products = await Product.find({ itemName: /LE PUY/i }).lean();
    if (products.length === 0) {
        const byCode = await Product.find({ itemCode: 'PUY-EVFR-750-22' }).lean();
        console.log(JSON.stringify(byCode, null, 2));
    } else {
        console.log(JSON.stringify(products, null, 2));
    }

    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
