const mongoose = require('mongoose');

const SpecialOrderSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, index: true }, // Links to User.username
    itemCode: { type: String, required: true },
    productId: { type: String }, // Links to Product.id (original source)
    producer: { type: String },
    productName: { type: String },
    vintage: { type: String },
    packSize: { type: String },
    bottleSize: { type: String },
    productType: { type: String },
    fobCasePrice: { type: Number },
    supplier: { type: String },
    uploadDate: { type: Date },
    frontlinePrice: { type: String },
    srp: { type: String },
    whlsBottle: { type: String },
    laidIn: { type: String },
    formulaUsed: { type: String },
    productLink: { type: String },
    isSuggestedLink: { type: Boolean },
    cases: { type: Number, default: 0 },
    bottles: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    status: { type: String, default: 'Requested' },
    notes: { type: String, default: '' },
    adminNotes: { type: String, default: '' },
    submitted: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false }, // Tracks if item has been added to historical orders,
    hasUnseenUpdate: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('SpecialOrder', SpecialOrderSchema);
