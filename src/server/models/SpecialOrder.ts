import mongoose, { Schema } from 'mongoose';
import { ISpecialOrder } from '../../shared/types';

const SpecialOrderSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, index: true },
    itemCode: { type: String, required: true },
    productId: { type: String },
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
    status: { type: String, default: 'Pending' },
    notes: { type: String, default: '' },
    adminNotes: { type: String, default: '' },
    submitted: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    hasUnseenUpdate: { type: Boolean, default: false },
    messages: [{
        id: String,
        text: String,
        sender: String,
        timestamp: Date,
        isAdmin: Boolean
    }]
}, {
    timestamps: true
});

export default mongoose.model<ISpecialOrder>('SpecialOrder', SpecialOrderSchema);
