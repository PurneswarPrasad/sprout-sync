"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticateJWT = void 0;
const jwt_1 = require("../utils/jwt");
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({
            success: false,
            error: 'No authorization header',
        });
    }
    const token = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : authHeader;
    try {
        const decoded = (0, jwt_1.verifyToken)(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token',
        });
    }
};
exports.authenticateJWT = authenticateJWT;
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return next();
    }
    const token = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : authHeader;
    try {
        const decoded = (0, jwt_1.verifyToken)(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=jwtAuth.js.map