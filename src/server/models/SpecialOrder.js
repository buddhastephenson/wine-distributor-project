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
var SpecialOrderSchema = new mongoose_1.Schema({
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
    adminUnseen: { type: Boolean, default: true }, // Default to true for new orders
    messages: [{
            id: String,
            text: String,
            sender: String,
            timestamp: Date,
            isAdmin: Boolean
        }],
    impersonatedBy: { type: String } // Username of the admin/rep who placed/updated this order
}, {
    timestamps: true
});
exports.default = mongoose_1.default.model('SpecialOrder', SpecialOrderSchema);
