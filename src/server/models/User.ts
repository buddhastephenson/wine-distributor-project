import mongoose, { Schema } from 'mongoose';
import { IUser } from '../../shared/types';

const UserSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true }, // custom ID
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    type: { type: String, enum: ['admin', 'customer', 'vendor'], default: 'customer' },
    isSuperAdmin: { type: Boolean, default: false },
    vendors: { type: [String], default: [] },
    email: { type: String, required: true, unique: true },
    accessRevoked: { type: Boolean, default: false },
    resetToken: { type: String },
    resetTokenExpiry: { type: Number }
}, {
    timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema);
