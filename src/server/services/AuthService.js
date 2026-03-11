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
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var nodemailer_1 = __importDefault(require("nodemailer"));
var User_1 = __importDefault(require("../models/User"));
// Configure transporter
var transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
var AuthService = /** @class */ (function () {
    function AuthService() {
    }
    AuthService.prototype.signup = function (userData) {
        return __awaiter(this, void 0, void 0, function () {
            var username, password, email, type, role, userType, existingUser, hashedPassword, newUser, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        username = userData.username, password = userData.password, email = userData.email, type = userData.type, role = userData.role;
                        userType = type || role || 'customer';
                        if (!username || !password || !email) {
                            return [2 /*return*/, { success: false, error: 'Missing required fields' }];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, User_1.default.findOne({
                                $or: [
                                    { username: { $regex: new RegExp("^".concat(username, "$"), 'i') } },
                                    { email: { $regex: new RegExp("^".concat(email, "$"), 'i') } }
                                ]
                            })];
                    case 2:
                        existingUser = _a.sent();
                        if (existingUser) {
                            console.log("Signup Failed: Conflict with existing user: ".concat(existingUser.username, " (").concat(existingUser.email, ")"));
                            if (existingUser.email.toLowerCase() === email.toLowerCase() && existingUser.accessRevoked) {
                                return [2 /*return*/, { success: false, error: 'This email is associated with a revoked account.' }];
                            }
                            return [2 /*return*/, { success: false, error: 'User or Email already exists' }];
                        }
                        return [4 /*yield*/, bcryptjs_1.default.hash(password, 10)];
                    case 3:
                        hashedPassword = _a.sent();
                        return [4 /*yield*/, User_1.default.create({
                                id: "user-".concat(Date.now()),
                                username: username,
                                password: hashedPassword,
                                type: userType,
                                status: 'pending',
                                email: email
                            })];
                    case 4:
                        newUser = _a.sent();
                        // Mock Email - TODO: Switch to real email if desired
                        console.log("\n--- WELCOME EMAIL SIMULATION ---");
                        console.log("To: ".concat(email));
                        console.log("Subject: Welcome to AOC Special Orders!");
                        console.log("Content: Hello ".concat(username, ", your account has been created."));
                        console.log("----------------------------------\n");
                        return [2 /*return*/, {
                                success: true,
                                message: 'Account created successfully. Pending administrator approval.'
                            }];
                    case 5:
                        error_1 = _a.sent();
                        console.error('Signup Error:', error_1);
                        if (error_1.code === 11000) {
                            return [2 /*return*/, { success: false, error: 'User or Email already exists (Duplicate Key)' }];
                        }
                        throw error_1;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.login = function (credentials) {
        return __awaiter(this, void 0, void 0, function () {
            var username, password, user, isMatch, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        username = credentials.username, password = credentials.password;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, User_1.default.findOne({
                                username: { $regex: new RegExp("^".concat(username, "$"), 'i') }
                            })];
                    case 2:
                        user = _a.sent();
                        if (!user) {
                            console.log("Login Failed: User not found \"".concat(username, "\""));
                            return [2 /*return*/, { success: false, error: 'Invalid credentials' }];
                        }
                        return [4 /*yield*/, bcryptjs_1.default.compare(password, user.password || '')];
                    case 3:
                        isMatch = _a.sent();
                        if (!isMatch) {
                            console.log("Login Failed: Invalid password for \"".concat(username, "\""));
                            return [2 /*return*/, { success: false, error: 'Invalid credentials' }];
                        }
                        if (user.accessRevoked) {
                            return [2 /*return*/, { success: false, error: 'Access Revoked. Please contact administrator.' }];
                        }
                        if (user.status === 'pending') {
                            return [2 /*return*/, { success: false, error: 'Account pending approval. Please contact administrator.' }];
                        }
                        if (user.status === 'rejected') {
                            return [2 /*return*/, { success: false, error: 'Account application rejected.' }];
                        }
                        return [2 /*return*/, {
                                success: true,
                                user: {
                                    id: user.id,
                                    username: user.username,
                                    type: user.type,
                                    email: user.email,
                                    isSuperAdmin: !!user.isSuperAdmin,
                                    vendors: user.vendors
                                }
                            }];
                    case 4:
                        error_2 = _a.sent();
                        throw error_2;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.forgotPassword = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            var user, token, expiry, baseUrl, resetLink, mailOptions, emailError_1, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 9, , 10]);
                        return [4 /*yield*/, User_1.default.findOne({ email: email })];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            // Security: don't reveal existence
                            return [2 /*return*/, { success: true, message: 'If an account exists with this email, a reset link will be sent.' }];
                        }
                        token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                        expiry = Date.now() + 3600000;
                        user.resetToken = token;
                        user.resetTokenExpiry = expiry;
                        return [4 /*yield*/, user.save()];
                    case 2:
                        _a.sent();
                        baseUrl = process.env.PUBLIC_URL || 'https://trade.aocwinecompany.com';
                        resetLink = "".concat(baseUrl, "/reset-password?token=").concat(token);
                        mailOptions = {
                            from: process.env.SMTP_FROM || '"AOC Wines" <noreply@aocwines.com>',
                            to: email,
                            subject: 'Password Reset Request',
                            text: "You requested a password reset. Please click the following link to reset your password: ".concat(resetLink, "\n\nIf you did not request this, please ignore this email."),
                            html: "<p>You requested a password reset.</p><p>Please click the following link to reset your password: <a href=\"".concat(resetLink, "\">").concat(resetLink, "</a></p><p>If you did not request this, please ignore this email.</p>")
                        };
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 7, , 8]);
                        if (!process.env.SMTP_USER) return [3 /*break*/, 5];
                        return [4 /*yield*/, transporter.sendMail(mailOptions)];
                    case 4:
                        _a.sent();
                        console.log("Password reset email sent to ".concat(email));
                        return [3 /*break*/, 6];
                    case 5:
                        console.log('SMTP not configured. Mocking email send.');
                        console.log("Link: ".concat(resetLink));
                        _a.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        emailError_1 = _a.sent();
                        console.error('Failed to send email:', emailError_1);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/, { success: true, message: 'If an account exists with this email, a reset link will be sent.' }];
                    case 9:
                        error_3 = _a.sent();
                        throw error_3;
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.resetPassword = function (token, password) {
        return __awaiter(this, void 0, void 0, function () {
            var user, hashedPassword, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, User_1.default.findOne({
                                resetToken: token,
                                resetTokenExpiry: { $gt: Date.now() }
                            })];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            return [2 /*return*/, { success: false, error: 'Invalid or expired reset token' }];
                        }
                        return [4 /*yield*/, bcryptjs_1.default.hash(password, 10)];
                    case 2:
                        hashedPassword = _a.sent();
                        user.password = hashedPassword;
                        user.resetToken = undefined;
                        user.resetTokenExpiry = undefined;
                        return [4 /*yield*/, user.save()];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, { success: true, message: 'Password has been reset successfully.' }];
                    case 4:
                        error_4 = _a.sent();
                        throw error_4;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.quickCreateCustomer = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var existingUser, sanitizedUsername, dummyEmail, hashedPassword, newUser, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!username)
                            return [2 /*return*/, { success: false, error: 'Username is required' }];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, User_1.default.findOne({
                                username: { $regex: new RegExp("^".concat(username, "$"), 'i') }
                            })];
                    case 2:
                        existingUser = _a.sent();
                        if (existingUser) {
                            return [2 /*return*/, { success: false, error: 'Username already exists' }];
                        }
                        sanitizedUsername = username.replace(/[^a-zA-Z0-9]/g, '');
                        dummyEmail = "".concat(sanitizedUsername, "-").concat(Date.now(), "@placeholder.local");
                        return [4 /*yield*/, bcryptjs_1.default.hash(username, 10)];
                    case 3:
                        hashedPassword = _a.sent();
                        return [4 /*yield*/, User_1.default.create({
                                id: "user-".concat(Date.now()),
                                username: username,
                                password: hashedPassword,
                                type: 'customer',
                                email: dummyEmail
                            })];
                    case 4:
                        newUser = _a.sent();
                        return [2 /*return*/, {
                                success: true,
                                user: {
                                    id: newUser.id,
                                    username: newUser.username,
                                    type: 'customer',
                                    email: newUser.email
                                }
                            }];
                    case 5:
                        error_5 = _a.sent();
                        console.error('Quick Create Error:', error_5);
                        throw error_5;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    AuthService.prototype.updatePassword = function (id, password) {
        return __awaiter(this, void 0, void 0, function () {
            var user, hashedPassword;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, User_1.default.findOne({ id: id })];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            return [2 /*return*/, { success: false, error: 'User not found' }];
                        }
                        return [4 /*yield*/, bcryptjs_1.default.hash(password, 10)];
                    case 2:
                        hashedPassword = _a.sent();
                        user.password = hashedPassword;
                        return [4 /*yield*/, user.save()];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, { success: true, message: 'Password updated successfully' }];
                }
            });
        });
    };
    AuthService.prototype.updateStatus = function (id, status) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, User_1.default.findOne({ id: id })];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            return [2 /*return*/, { success: false, error: 'User not found' }];
                        }
                        user.status = status;
                        return [4 /*yield*/, user.save()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, { success: true, user: user }];
                }
            });
        });
    };
    return AuthService;
}());
exports.default = new AuthService();
