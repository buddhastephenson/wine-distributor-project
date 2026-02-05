const mongoose = require('mongoose');

const StorageSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true } // Storing stringified JSON
}, { timestamps: true });

module.exports = mongoose.model('Storage', StorageSchema);
