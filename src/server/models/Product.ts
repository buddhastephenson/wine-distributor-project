import mongoose, { Schema } from 'mongoose';
import { IProduct } from '../../shared/types';

const ProductSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    itemCode: { type: String, required: true },
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
    grapeVariety: { type: String, default: '' },
    extendedData: { type: Schema.Types.Mixed, default: {} },
    supplier: { type: String, default: '' },
    vendor: { type: String, ref: 'User' },
    uploadDate: { type: Date, default: Date.now }
}, {
    timestamps: true,
    strict: false // Allow other fields if data structure varies (legacy behavior)
});

export default mongoose.model<IProduct>('Product', ProductSchema);
