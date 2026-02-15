const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/wine-distributor')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error(err));

const SpecialOrderSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, index: true },
    producer: { type: String },
    productName: { type: String },
    vintage: { type: String },
    bottleSize: { type: String },
    packSize: { type: String },
    fobCasePrice: { type: Number },
    supplier: { type: String },
    status: { type: String, default: 'Pending' },
    submitted: { type: Boolean, default: false },
    hasUnseenUpdate: { type: Boolean, default: false },
    adminUnseen: { type: Boolean, default: true },
    itemCode: { type: String },
    cases: { type: Number, default: 0 },
    bottles: { type: Number, default: 0 }
}, { strict: false });

const SpecialOrder = mongoose.model('SpecialOrder', SpecialOrderSchema);

async function checkOrCreateOrder() {
    try {
        const order = await SpecialOrder.findOne({ supplier: 'Indigenous Selections' });

        if (order) {
            console.log('Found existing order for Indigenous Selections:', order.id);
        } else {
            console.log('No order found. Creating test order...');
            const newOrder = await SpecialOrder.create({
                id: `so-test-${Date.now()}`,
                username: 'trey', // Customer who placed it
                producer: 'Test Producer',
                productName: 'Test Wine for Vendor',
                vintage: '2023',
                bottleSize: '750ml',
                packSize: '12',
                fobCasePrice: 100,
                supplier: 'Indigenous Selections',
                status: 'Pending',
                submitted: true, // Needs to be submitted to be visible to Vendor? Yes based on logic
                itemCode: 'TEST-123',
                cases: 1,
                bottles: 0
            });
            console.log('Created test order:', newOrder.id);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.disconnect();
    }
}

checkOrCreateOrder();
