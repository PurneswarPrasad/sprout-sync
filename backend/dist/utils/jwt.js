"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeToken = exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env['JWT_SECRET'] || 'your-jwt-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env['JWT_EXPIRES_IN'] || '7d';
const generateToken = (payload) => {
    const options = {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'sprout-sync',
        audience: 'sprout-sync-users',
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, options);
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET, {
            issuer: 'sprout-sync',
            audience: 'sprout-sync-users',
        });
        return decoded;
    }
    catch (error) {
        throw new Error('Invalid or expired token');
    }
};
exports.verifyToken = verifyToken;
const decodeToken = (token) => {
    try {
        return jsonwebtoken_1.default.decode(token);
    }
    catch (error) {
        return null;
    }
};
exports.decodeToken = decodeToken;
//# sourceMappingURL=jwt.js.map