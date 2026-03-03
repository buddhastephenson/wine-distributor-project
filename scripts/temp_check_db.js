const mongoose = require('mongoose');

// Need to read from .env but .env doesn't exist, we fallback to default
const MONGO_URI = 'mongodb://localhost:27017/wine-distributor';

async function run() {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    console.log("--- Zev Rovine Products ---");
    const zevProducts = await db.collection('products').find({
        $or: [
            { supplier: /Zev/i },
            { vendor: /Zev/i }
        ]
    }).limit(2).toArray();
    console.dir(zevProducts, { depth: null });

    console.log("--- Sake Products ---");
    const sakeProducts = await db.collection('products').find({
        $or: [
            { productName: /sake/i },
            { productType: /sake/i },
            { extendedData: /sake/i },
            { producer: /sake/i }
        ]
    }).limit(2).toArray();
    console.dir(sakeProducts, { depth: null });

    process.exit(0);
}

run().catch(console.error);
