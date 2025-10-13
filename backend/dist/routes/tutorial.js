"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const jwtAuth_1 = require("../middleware/jwtAuth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.use(jwtAuth_1.authenticateJWT);
router.get('/state', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
        }
        let settings = await prisma.userSettings.findUnique({
            where: { userId },
            select: {
                tutorialCompleted: true,
                tutorialCompletedSteps: true,
                tutorialSkippedSteps: true,
            }
        });
        if (!settings) {
            return res.json({
                success: true,
                data: {
                    completedSteps: [],
                    skippedSteps: [],
                    hasCompletedTutorial: false,
                }
            });
        }
        return res.json({
            success: true,
            data: {
                completedSteps: settings.tutorialCompletedSteps || [],
                skippedSteps: settings.tutorialSkippedSteps || [],
                hasCompletedTutorial: settings.tutorialCompleted || false,
            }
        });
    }
    catch (error) {
        console.error('Error fetching tutorial state:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch tutorial state'
        });
    }
});
router.post('/state', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
        }
        const { completedSteps, skippedSteps, hasCompletedTutorial } = req.body;
        if (!Array.isArray(completedSteps) && completedSteps !== undefined) {
            return res.status(400).json({
                success: false,
                error: 'completedSteps must be an array'
            });
        }
        if (!Array.isArray(skippedSteps) && skippedSteps !== undefined) {
            return res.status(400).json({
                success: false,
                error: 'skippedSteps must be an array'
            });
        }
        const settings = await prisma.userSettings.upsert({
            where: { userId },
            update: {
                ...(completedSteps !== undefined && { tutorialCompletedSteps: completedSteps }),
                ...(skippedSteps !== undefined && { tutorialSkippedSteps: skippedSteps }),
                ...(hasCompletedTutorial !== undefined && { tutorialCompleted: hasCompletedTutorial }),
            },
            create: {
                userId,
                persona: 'PRIMARY',
                timezone: 'UTC',
                tutorialCompleted: hasCompletedTutorial || false,
                tutorialCompletedSteps: completedSteps || [],
                tutorialSkippedSteps: skippedSteps || [],
            },
            select: {
                tutorialCompleted: true,
                tutorialCompletedSteps: true,
                tutorialSkippedSteps: true,
            }
        });
        return res.json({
            success: true,
            data: {
                completedSteps: settings.tutorialCompletedSteps,
                skippedSteps: settings.tutorialSkippedSteps,
                hasCompletedTutorial: settings.tutorialCompleted,
            }
        });
    }
    catch (error) {
        console.error('Error updating tutorial state:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update tutorial state'
        });
    }
});
router.post('/complete', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
        }
        const settings = await prisma.userSettings.upsert({
            where: { userId },
            update: {
                tutorialCompleted: true,
            },
            create: {
                userId,
                persona: 'PRIMARY',
                timezone: 'UTC',
                tutorialCompleted: true,
                tutorialCompletedSteps: [],
                tutorialSkippedSteps: [],
            },
            select: {
                tutorialCompleted: true,
                tutorialCompletedSteps: true,
                tutorialSkippedSteps: true,
            }
        });
        return res.json({
            success: true,
            data: {
                completedSteps: settings.tutorialCompletedSteps,
                skippedSteps: settings.tutorialSkippedSteps,
                hasCompletedTutorial: settings.tutorialCompleted,
            }
        });
    }
    catch (error) {
        console.error('Error completing tutorial:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to complete tutorial'
        });
    }
});
exports.default = router;
//# sourceMappingURL=tutorial.js.map