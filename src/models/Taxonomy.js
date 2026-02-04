const mongoose = require('mongoose');

const TaxonomySchema = new mongoose.Schema({
    name: { type: String, default: 'main_taxonomy' },
    data: { type: Object, required: true } // Stores the nested tree structure
}, { timestamps: true });

module.exports = mongoose.model('Taxonomy', TaxonomySchema);
