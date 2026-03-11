"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = __importDefault(require("mongoose"));
var dotenv_1 = __importDefault(require("dotenv"));
var ProductService_1 = __importDefault(require("../src/server/services/ProductService"));
var SpecialOrder_1 = __importDefault(require("../src/server/models/SpecialOrder"));
dotenv_1.default.config();
function testHiddenLogic() {
    return __awaiter(this, void 0, void 0, function () {
        var uri, supplierName, keptCode, deletedCode, updatedCode, importPayload, stats, allDBProducts, catalogProducts, testCatalog;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    uri = process.env.MONGO_URI || 'mongodb://localhost:27017/wine-distributor';
                    return [4 /*yield*/, mongoose_1.default.connect(uri)];
                case 1:
                    _a.sent();
                    supplierName = "Hidden Logic Test Supplier";
                    keptCode = "TEST-KEEP-1";
                    deletedCode = "TEST-DEL-1";
                    updatedCode = "TEST-UPD-1";
                    console.log("Cleaning up previous test items...");
                    return [4 /*yield*/, mongoose_1.default.connection.collection('products').deleteMany({ supplier: supplierName })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, mongoose_1.default.connection.collection('specialorders').deleteMany({ supplier: supplierName })];
                case 3:
                    _a.sent();
                    // Step 1: Create Initial Products
                    console.log("Creating initial products...");
                    return [4 /*yield*/, ProductService_1.default.createProduct({
                            itemCode: keptCode,
                            productName: "Kept Legacy Wine",
                            supplier: supplierName,
                            producer: "Test Producer",
                            isHidden: false
                        })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, ProductService_1.default.createProduct({
                            itemCode: deletedCode,
                            productName: "To Be Deleted Wine",
                            supplier: supplierName,
                            producer: "Test Producer",
                            isHidden: false
                        })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, ProductService_1.default.createProduct({
                            itemCode: updatedCode,
                            productName: "To Be Updated Wine",
                            supplier: supplierName,
                            producer: "Test Producer",
                            isHidden: true // artificially set true to verify it un-hides on update
                        })];
                case 6:
                    _a.sent();
                    // Step 2: Create Active Order for keptCode
                    console.log("Creating active order to protect TEST-KEEP-1...");
                    return [4 /*yield*/, SpecialOrder_1.default.create({
                            itemCode: keptCode,
                            supplier: supplierName,
                            status: 'Pending',
                            isArchived: false,
                            productName: "Kept Legacy Wine (Order)",
                            username: "testuser",
                            id: "order-123"
                        })];
                case 7:
                    _a.sent();
                    // Step 3: Simulate Import (omits KEEP and DEL, includes UPD and a NEW one)
                    console.log("Simulating new import...");
                    importPayload = [
                        {
                            itemCode: updatedCode,
                            productName: "Updated Wine (Imported)",
                            supplier: supplierName,
                            producer: "Test Producer"
                        },
                        {
                            itemCode: "TEST-NEW-1",
                            productName: "Brand New Wine (Imported)",
                            supplier: supplierName,
                            producer: "Test Producer"
                        }
                    ];
                    return [4 /*yield*/, ProductService_1.default.bulkImport(importPayload, supplierName)];
                case 8:
                    stats = _a.sent();
                    console.log("Import Stats:", stats);
                    return [4 /*yield*/, mongoose_1.default.connection.collection('products').find({ supplier: supplierName }).toArray()];
                case 9:
                    allDBProducts = _a.sent();
                    console.log("Products in DB: ".concat(allDBProducts.length));
                    allDBProducts.forEach(function (p) {
                        console.log("- ".concat(p.itemCode, ": isHidden=").concat(p.isHidden, ", name=").concat(p.productName));
                    });
                    // Step 5: Verify getAllProducts API filters correct items
                    console.log("Testing getAllProducts()...");
                    return [4 /*yield*/, ProductService_1.default.getAllProducts()];
                case 10:
                    catalogProducts = _a.sent();
                    testCatalog = catalogProducts.filter(function (p) { return p.supplier === supplierName; });
                    console.log("Visible in Catalog: ".concat(testCatalog.length));
                    testCatalog.forEach(function (p) { return console.log("- ".concat(p.itemCode)); });
                    process.exit(0);
                    return [2 /*return*/];
            }
        });
    });
}
testHiddenLogic().catch(function (err) {
    console.error(err);
    process.exit(1);
});
