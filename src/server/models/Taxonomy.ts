import mongoose, { Schema } from 'mongoose';
import { ITaxonomy } from '../../shared/types';

const TaxonomySchema: Schema = new Schema({
    name: { type: String, default: 'main_taxonomy' },
    data: { type: Schema.Types.Mixed, required: true }
}, {
    timestamps: true
});

export default mongoose.model<ITaxonomy>('Taxonomy', TaxonomySchema);
