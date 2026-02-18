const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/wine-distributor';

const userSchema = new mongoose.Schema({}, { strict: false });
const productSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const users = await User.find({
            $or: [
                { username: /Louis/i },
                { vendors: { $in: [/Louis/i] } }
            ]
        });

        console.log('--- Users ---');
        users.forEach(u => {
            console.log(`User: ${u.username}, ID: ${u.id}, Type: ${u.type}`);
            console.log(`Assigned Vendors: ${JSON.stringify(u.vendors)}`);
        });

        const products = await Product.aggregate([
            { $match: { supplier: /Louis/i } },
            { $group: { _id: "$supplier", count: { $sum: 1 } } }
        ]);

        console.log('--- Products by Supplier ---');
        products.forEach(p => {
            console.log(`Supplier: "${p._id}", Count: ${p.count}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
