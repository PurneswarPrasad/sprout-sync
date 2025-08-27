"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.authRouter = router;
router.get('/google', auth_1.isNotAuthenticated, passport_1.default.authenticate('google', {
    scope: ['profile', 'email'],
}));
router.get('/google/callback', passport_1.default.authenticate('google', {
    failureRedirect: process.env['FRONTEND_URL'] || 'http://localhost:5173',
    failureMessage: true,
}), (req, res) => {
    const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/home`);
});
router.get('/profile', auth_1.isAuthenticated, (req, res) => {
    const user = req.user;
    res.json({
        success: true,
        data: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt,
        },
    });
});
router.post('/logout', auth_1.isAuthenticated, (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    });
});
router.get('/status', (req, res) => {
    res.json({
        success: true,
        authenticated: req.isAuthenticated(),
        user: req.isAuthenticated() ? {
            id: req.user.id,
            email: req.user.email,
            name: req.user.name,
            avatarUrl: req.user.avatarUrl,
        } : null,
    });
});
//# sourceMappingURL=auth.js.map