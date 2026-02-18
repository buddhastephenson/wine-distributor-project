const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/wine-distributor';

const Product = mongoose.model('Product', new mongoose.Schema({
    supplier: String
}, { strict: false }));

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const suppliers = await Product.distinct('supplier', { supplier: /Louis/i });
        console.log('--- "Louis" Suppliers ---');
        suppliers.forEach(s => {
            console.log(`"${s}" (Length: ${s.length})`);
            // print char codes
            for (let i = 0; i < s.length; i++) {
                process.stdout.write(s.charCodeAt(i) + " ");
            }
            console.log("\n");
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
