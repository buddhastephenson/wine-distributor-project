"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Product_1 = __importDefault(require("../models/Product"));
var SpecialOrder_1 = __importDefault(require("../models/SpecialOrder"));
var mongoose_1 = __importDefault(require("mongoose"));
var uuid_1 = require("uuid");
var User_1 = __importDefault(require("../models/User"));
var ProductService = /** @class */ (function () {
    function ProductService() {
    }
    ProductService.prototype.getAllProducts = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = {};
                        // Filter for Vendor Admins
                        if (user && (user.type === 'admin' || user.type === 'vendor') && user.vendors && user.vendors.length > 0) {
                            // Only show products where supplier is in their allowed list
                            if (user.type === 'vendor') {
                                // Vendors see assigned suppliers OR products they created/own directly
                                query.$or = [
                                    { supplier: { $in: user.vendors } },
                                    { vendor: user.id }
                                ];
                            }
                            else {
                                query.supplier = { $in: user.vendors };
                            }
                        }
                        else if (user && user.type === 'vendor') {
                            // Vendors only see products they own
                            query.vendor = user.id;
                        }
                        // Note: Customers and SuperAdmins (or admins with no vendors assigned) see everything.
                        // Global filter: exclude hidden products from the catalog view
                        query.isHidden = { $ne: true };
                        return [4 /*yield*/, Product_1.default.find(query, '-_id -__v -createdAt -updatedAt').lean()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    ProductService.prototype.getProductById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Product_1.default.findOne({ id: id }, '-_id -__v -createdAt -updatedAt').lean()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    ProductService.prototype.updateProduct = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var product;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (updates.itemCode)
                            updates.itemCode = updates.itemCode.trim();
                        if (updates.supplier)
                            updates.supplier = updates.supplier.trim();
                        return [4 /*yield*/, Product_1.default.findOneAndUpdate({ id: id }, updates, { new: true })];
                    case 1:
                        product = _a.sent();
                        return [2 /*return*/, product ? product.toObject() : null]; // toObject might be needed if strict typing issues, or lean() on query
                }
            });
        });
    };
    ProductService.prototype.deleteProduct = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Product_1.default.findOneAndDelete({ id: id })];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, !!result];
                }
            });
        });
    };
    ProductService.prototype.createProduct = function (productData) {
        return __awaiter(this, void 0, void 0, function () {
            var newProduct, savedProduct;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (productData.itemCode)
                            productData.itemCode = productData.itemCode.trim();
                        if (productData.supplier)
                            productData.supplier = productData.supplier.trim();
                        newProduct = new Product_1.default(__assign(__assign({ id: (0, uuid_1.v4)() }, productData), { uploadDate: new Date() }));
                        return [4 /*yield*/, newProduct.save()];
                    case 1:
                        savedProduct = _a.sent();
                        return [2 /*return*/, savedProduct.toObject()];
                }
            });
        });
    };
    ProductService.prototype.bulkImport = function (products, supplier, vendorId) {
        return __awaiter(this, void 0, void 0, function () {
            var user, e_1, activeOrders, activeItemCodes, newItemCodes, keepCodes, protectCodes, deleteResult, added, updated, operations, bulkResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Enforce trim to prevent trailing spaces from creating duplicates
                        supplier = supplier ? supplier.trim() : '';
                        if (!vendorId) return [3 /*break*/, 8];
                        console.log("Processing Vendor Association: ID=".concat(vendorId));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, User_1.default.findOne({ id: vendorId })];
                    case 2:
                        user = _a.sent();
                        if (!user) return [3 /*break*/, 5];
                        // Add supplier if not present
                        if (!user.vendors)
                            user.vendors = [];
                        if (!!user.vendors.includes(supplier)) return [3 /*break*/, 4];
                        user.vendors.push(supplier);
                        // Ensure they are promoted to restricted admin (Vendor) if not already
                        // logic: if they are being assigned a portfolio, they must be a vendor type.
                        // User said: "Vendor is created by an Admin as a User with Vendor credentials"
                        // We'll enforce the restricted admin structure just to be safe so permissions work.
                        if (user.type !== 'admin' || user.isSuperAdmin) {
                            user.type = 'admin';
                            user.isSuperAdmin = false;
                        }
                        return [4 /*yield*/, user.save()];
                    case 3:
                        _a.sent();
                        console.log("Associated supplier ".concat(supplier, " to existing vendor user ").concat(user.username));
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        console.warn("Vendor User ID ".concat(vendorId, " not found"));
                        _a.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        e_1 = _a.sent();
                        console.error('Error updating existing vendor association:', e_1);
                        return [3 /*break*/, 8];
                    case 8: return [4 /*yield*/, SpecialOrder_1.default.find({
                            supplier: supplier,
                            status: { $nin: ['Delivered', 'Cancelled', 'Out of Stock'] },
                            isArchived: { $ne: true }
                        }).select('itemCode')];
                    case 9:
                        activeOrders = _a.sent();
                        activeItemCodes = new Set(activeOrders.map(function (o) { return o.itemCode; }));
                        newItemCodes = new Set(products.map(function (p) { return p.itemCode; }));
                        keepCodes = Array.from(activeItemCodes).filter(function (code) { return !newItemCodes.has(code); });
                        protectCodes = __spreadArray(__spreadArray([], Array.from(newItemCodes), true), keepCodes, true);
                        if (!(keepCodes.length > 0)) return [3 /*break*/, 11];
                        return [4 /*yield*/, Product_1.default.updateMany({
                                supplier: supplier,
                                itemCode: { $in: keepCodes }
                            }, { $set: { isHidden: true } })];
                    case 10:
                        _a.sent();
                        _a.label = 11;
                    case 11: return [4 /*yield*/, Product_1.default.deleteMany({
                            supplier: supplier,
                            itemCode: { $nin: protectCodes }
                        })];
                    case 12:
                        deleteResult = _a.sent();
                        added = 0;
                        updated = 0;
                        operations = products.map(function (p) {
                            // Ensure consistent casing/spaces
                            p.itemCode = p.itemCode ? p.itemCode.trim() : '';
                            // Ensure we don't overwrite existing ID if we are updating
                            var id = p.id, productData = __rest(p, ["id"]);
                            return {
                                updateOne: {
                                    filter: { itemCode: p.itemCode, supplier: supplier }, // Use composite key
                                    update: {
                                        $set: __assign(__assign({}, productData), { uploadDate: new Date(), isHidden: false }), // Explicitly un-hide in case it was previously hidden
                                        $setOnInsert: { id: (0, uuid_1.v4)() }
                                    },
                                    upsert: true
                                }
                            };
                        });
                        if (!(operations.length > 0)) return [3 /*break*/, 14];
                        return [4 /*yield*/, Product_1.default.bulkWrite(operations)];
                    case 13:
                        bulkResult = _a.sent();
                        added = bulkResult.upsertedCount;
                        updated = bulkResult.modifiedCount; // This counts matched & modified
                        _a.label = 14;
                    case 14: return [2 /*return*/, {
                            added: added,
                            updated: updated,
                            deleted: deleteResult.deletedCount,
                            kept: keepCodes.length,
                            supplier: supplier
                        }];
                }
            });
        });
    };
    ProductService.prototype.bulkUpsertProducts = function (products) {
        return __awaiter(this, void 0, void 0, function () {
            var operations;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!Array.isArray(products))
                            return [2 /*return*/];
                        operations = products.map(function (p) { return ({
                            updateOne: {
                                filter: { id: p.id },
                                update: { $set: p },
                                upsert: true
                            }
                        }); });
                        if (!(operations.length > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, Product_1.default.bulkWrite(operations)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    ProductService.prototype.findDuplicates = function () {
        return __awaiter(this, void 0, void 0, function () {
            var pipeline;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pipeline = [
                            {
                                $group: {
                                    _id: { itemCode: "$itemCode", supplier: "$supplier" },
                                    count: { $sum: 1 },
                                    docs: { $push: { id: { $ifNull: ["$id", { $toString: "$_id" }] }, updatedAt: "$updatedAt", uploadDate: "$uploadDate", productName: "$productName", itemCode: "$itemCode", supplier: "$supplier", vintage: "$vintage", bottleSize: "$bottleSize" } }
                                }
                            },
                            {
                                $match: {
                                    count: { $gt: 1 }
                                }
                            }
                        ];
                        return [4 /*yield*/, Product_1.default.aggregate(pipeline)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    ProductService.prototype.deduplicate = function (groups) {
        return __awaiter(this, void 0, void 0, function () {
            var totalMerged, totalDeleted, _i, groups_1, group, updateResult, validObjectIds, deleteResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        totalMerged = 0;
                        totalDeleted = 0;
                        _i = 0, groups_1 = groups;
                        _a.label = 1;
                    case 1:
                        if (!(_i < groups_1.length)) return [3 /*break*/, 5];
                        group = groups_1[_i];
                        return [4 /*yield*/, SpecialOrder_1.default.updateMany({ productId: { $in: group.loserIds } }, { $set: { productId: group.winnerId } })];
                    case 2:
                        updateResult = _a.sent();
                        if (updateResult.modifiedCount > 0) {
                            console.log("Re-assigned ".concat(updateResult.modifiedCount, " orders to winner ").concat(group.winnerId));
                        }
                        validObjectIds = group.loserIds
                            .filter(function (id) { return mongoose_1.default.Types.ObjectId.isValid(id); })
                            .map(function (id) { return new mongoose_1.default.Types.ObjectId(id); });
                        return [4 /*yield*/, Product_1.default.deleteMany({
                                $or: [
                                    { id: { $in: group.loserIds } },
                                    { _id: { $in: validObjectIds } }
                                ]
                            })];
                    case 3:
                        deleteResult = _a.sent();
                        totalDeleted += deleteResult.deletedCount;
                        totalMerged++;
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 1];
                    case 5: return [2 /*return*/, { merged: totalMerged, deleted: totalDeleted }];
                }
            });
        });
    };
    // --- Supplier Management ---
    ProductService.prototype.getSupplierStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var stats;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Product_1.default.aggregate([
                            { $group: { _id: { $ifNull: ["$supplier", ""] }, count: { $sum: 1 } } },
                            { $sort: { _id: 1 } },
                            { $project: { supplier: "$_id", count: 1, _id: 0 } }
                        ])];
                    case 1:
                        stats = _a.sent();
                        return [2 /*return*/, stats];
                }
            });
        });
    };
    ProductService.prototype.renameSupplier = function (oldName, newName) {
        return __awaiter(this, void 0, void 0, function () {
            var productResult, orderResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Product_1.default.updateMany({ supplier: oldName }, { $set: { supplier: newName } })];
                    case 1:
                        productResult = _a.sent();
                        return [4 /*yield*/, SpecialOrder_1.default.updateMany({ supplier: oldName }, { $set: { supplier: newName } })];
                    case 2:
                        orderResult = _a.sent();
                        return [2 /*return*/, {
                                productsUpdated: productResult.modifiedCount,
                                ordersUpdated: orderResult.modifiedCount
                            }];
                }
            });
        });
    };
    ProductService.prototype.deleteSupplier = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var productResult, affectedOrders;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Product_1.default.deleteMany({ supplier: name })];
                    case 1:
                        productResult = _a.sent();
                        return [4 /*yield*/, SpecialOrder_1.default.countDocuments({ supplier: name })];
                    case 2:
                        affectedOrders = _a.sent();
                        return [2 /*return*/, {
                                productsDeleted: productResult.deletedCount,
                                ordersUpdated: affectedOrders // valid but potentially orphaned
                            }];
                }
            });
        });
    };
    return ProductService;
}());
exports.default = new ProductService();
