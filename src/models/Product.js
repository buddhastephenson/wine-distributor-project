const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    itemCode: { type: String, required: true }, // Removed unique: true to support legacy data duplicates
    producer: { type: String, required: true },
    productName: { type: String, required: true },
    vintage: { type: String, default: '' },
    packSize: { type: String, default: '12' },
    bottleSize: { type: String, default: '750' },
    productType: { type: String, default: 'wine' },
    fobCasePrice: { type: Number, default: 0 },
    productLink: { type: String, default: '' },
    country: { type: String, default: '' },
    region: { type: String, default: '' },
    appellation: { type: String, default: '' },
    supplier: { type: String, default: '' },
    uploadDate: { type: Date, default: Date.now }
}, {
    timestamps: true,
    strict: false // Allow other fields if data structure varies
});

module.exports = mongoose.model('Product', ProductSchema);
