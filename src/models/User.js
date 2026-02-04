const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Keeping string ID to match existing logic for now
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    type: { type: String, enum: ['admin', 'customer'], default: 'customer' },
    isSuperAdmin: { type: Boolean, default: false },
    email: { type: String, required: true, unique: true },
    accessRevoked: { type: Boolean, default: false },
    resetToken: { type: String },
    resetTokenExpiry: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
