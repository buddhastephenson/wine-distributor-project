"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = __importStar(require("mongoose"));
var ProductSchema = new mongoose_1.Schema({
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
    extendedData: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    supplier: { type: String, default: '' },
    vendor: { type: String, ref: 'User' },
    lastEditedBy: { type: String },
    lastEditedAt: { type: Date },
    uploadDate: { type: Date, default: Date.now },
    isHidden: { type: Boolean, default: false }
}, {
    timestamps: true,
    strict: false // Allow other fields if data structure varies (legacy behavior)
});
// Add a compound unique index to prevent exact duplicates of itemCode per supplier portfolio
// This acts as a database-level safety net for deduplication
ProductSchema.index({ itemCode: 1, supplier: 1 }, { unique: true });
exports.default = mongoose_1.default.model('Product', ProductSchema);
