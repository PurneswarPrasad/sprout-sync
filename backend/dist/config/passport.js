"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const prisma_1 = require("../lib/prisma");
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env['GOOGLE_CLIENT_ID'],
    clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
    callbackURL: process.env['OAUTH_CALLBACK_URL'] || 'http://localhost:3001/auth/google/callback',
}, async (_accessToken, _refreshToken, profile, done) => {
    try {
        const { id, displayName, emails } = profile;
        if (!emails || emails.length === 0) {
            return done(new Error('No email found in Google profile'), false);
        }
        const email = emails[0]?.value || '';
        const avatarUrl = profile.photos?.[0]?.value;
        let user = await prisma_1.prisma.user.findUnique({
            where: { googleId: id },
        });
        if (!user) {
            user = await prisma_1.prisma.user.create({
                data: {
                    googleId: id,
                    email,
                    name: displayName,
                    avatarUrl: avatarUrl ?? null,
                },
            });
        }
        else {
            user = await prisma_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    name: displayName,
                    avatarUrl: avatarUrl ?? null,
                },
            });
        }
        return done(null, user);
    }
    catch (error) {
        return done(error, false);
    }
}));
exports.default = passport_1.default;
//# sourceMappingURL=passport.js.map