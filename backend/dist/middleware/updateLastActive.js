"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLastActive = void 0;
const prisma_1 = require("../lib/prisma");
const updateLastActive = async (req, res, next) => {
    if (req.user && req.user.userId) {
        try {
            await prisma_1.prisma.userSettings.upsert({
                where: {
                    userId: req.user.userId
                },
                update: {
                    lastActiveAt: new Date()
                },
                create: {
                    userId: req.user.userId,
                    persona: 'PRIMARY',
                    timezone: 'UTC',
                    lastActiveAt: new Date()
                }
            });
        }
        catch (error) {
            console.error('Failed to update lastActiveAt:', error);
        }
    }
    next();
};
exports.updateLastActive = updateLastActive;
//# sourceMappingURL=updateLastActive.js.map