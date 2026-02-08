import mongoose, { Schema } from 'mongoose';
import { IStorage } from '../../shared/types';

const StorageSchema: Schema = new Schema({
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true }
}, {
    timestamps: true
});

export default mongoose.model<IStorage>('Storage', StorageSchema);
