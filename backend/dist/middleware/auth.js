"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNotAuthenticated = exports.isAuthenticated = void 0;
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({
        success: false,
        error: 'Authentication required',
    });
};
exports.isAuthenticated = isAuthenticated;
const isNotAuthenticated = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return next();
    }
    res.status(400).json({
        success: false,
        error: 'Already authenticated',
    });
};
exports.isNotAuthenticated = isNotAuthenticated;
//# sourceMappingURL=auth.js.map