"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const jwt_1 = require("../utils/jwt");
const jwtAuth_1 = require("../middleware/jwtAuth");
const router = (0, express_1.Router)();
exports.authRouter = router;
router.get('/google', (req, res, next) => {
    console.log('🔐 Initiating Google OAuth...');
    console.log('Environment:', process.env['NODE_ENV']);
    console.log('Google Client ID:', process.env['GOOGLE_CLIENT_ID'] ? 'Set' : 'Missing');
    console.log('Google Client Secret:', process.env['GOOGLE_CLIENT_SECRET'] ? 'Set' : 'Missing');
    console.log('Callback URL:', process.env['OAUTH_CALLBACK_URL']);
    passport_1.default.authenticate('google', {
        scope: ['profile', 'email'],
        accessType: 'offline',
        prompt: 'consent',
        session: false
    })(req, res, next);
});
router.get('/google/callback', (req, res, next) => {
    console.log('🔄 Google OAuth callback received');
    console.log('Query params:', req.query);
    passport_1.default.authenticate('google', {
        failureRedirect: process.env['FRONTEND_URL'] || 'http://localhost:5173',
        failureMessage: true,
        session: false,
    })(req, res, next);
}, (req, res) => {
    console.log('✅ OAuth successful');
    console.log('User:', req.user);
    if (!req.user) {
        console.log('❌ No user found after OAuth');
        return res.redirect(`${process.env['FRONTEND_URL'] || 'http://localhost:5173'}/auth-error`);
    }
    const user = req.user;
    const token = (0, jwt_1.generateToken)({
        userId: user.id,
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl || undefined,
        isNewUser: user.isNewUser || false,
    });
    console.log('🎫 JWT token generated');
    const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:5173';
    const isNewUser = user.isNewUser ? '&isNewUser=true' : '';
    const redirectUrl = `${frontendUrl}/auth-callback?token=${encodeURIComponent(token)}${isNewUser}`;
    console.log('Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);
});
router.get('/profile', jwtAuth_1.authenticateJWT, (req, res) => {
    res.json({
        success: true,
        data: {
            id: req.user.userId,
            email: req.user.email,
            name: req.user.name,
            avatarUrl: req.user.avatarUrl,
        },
    });
});
router.post('/logout', jwtAuth_1.authenticateJWT, (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully',
    });
});
router.get('/status', jwtAuth_1.authenticateJWT, (req, res) => {
    res.json({
        success: true,
        authenticated: true,
        user: {
            id: req.user.userId,
            email: req.user.email,
            name: req.user.name,
            avatarUrl: req.user.avatarUrl,
        },
    });
});
router.get('/status/public', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.json({
            success: true,
            authenticated: false,
            user: null,
        });
    }
    const token = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : authHeader;
    try {
        const { verifyToken } = require('../utils/jwt');
        const decoded = verifyToken(token);
        res.json({
            success: true,
            authenticated: true,
            user: {
                id: decoded.userId,
                email: decoded.email,
                name: decoded.name,
                avatarUrl: decoded.avatarUrl,
            },
        });
    }
    catch (error) {
        res.json({
            success: true,
            authenticated: false,
            user: null,
        });
    }
});
//# sourceMappingURL=auth.js.map