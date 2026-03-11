const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017/aoc-wines';

mongoose.connect(uri)
    .then(async () => {
        const db = mongoose.connection.db;
        const products = db.collection('products');

        const suppliers = await products.distinct('supplier');
        console.log("Suppliers:", suppliers);

        const zrsSupplier = suppliers.find(s => s && s.toLowerCase().includes('zev') || s && s.toLowerCase().includes('zrs'));
        if (zrsSupplier) {
            console.log("Found ZRS Supplier:", zrsSupplier);
            const zevProducts = await products.find({ supplier: zrsSupplier }).limit(5).toArray();
            console.log(`Found ${zevProducts.length} ZRS products...`);
            console.log("Samples:");
            zevProducts.forEach(p => {
                console.log(`- ${p.productName} (SKU: ${p.itemCode})`);
                console.log(`   Keys:`, Object.keys(p).join(', '));
                if (p.extendedData) {
                    console.log(`   ExtendedData Keys:`, Object.keys(p.extendedData).join(', '));
                }
            });
        }

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
