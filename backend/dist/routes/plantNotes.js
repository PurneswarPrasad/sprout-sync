"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plantNotesRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const validate_1 = require("../middleware/validate");
const jwtAuth_1 = require("../middleware/jwtAuth");
const dtos_1 = require("../dtos");
const router = (0, express_1.Router)();
exports.plantNotesRouter = router;
const checkPlantOwnership = async (req, res, next) => {
    try {
        const plantId = req.params.plantId;
        const userId = req.user.userId;
        const plant = await prisma_1.prisma.plant.findFirst({
            where: {
                id: plantId,
                userId: userId,
            },
        });
        if (!plant) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Plant not found or you do not own this plant.',
            });
        }
        req.plant = plant;
        next();
    }
    catch (error) {
        console.error('Error checking plant ownership:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify plant ownership',
        });
    }
};
router.get('/', jwtAuth_1.authenticateJWT, checkPlantOwnership, async (req, res) => {
    try {
        const plantId = req.params['plantId'];
        const { taskKey, preset, page = '1', limit = '20' } = req.query;
        const pageNum = parseInt(page.toString());
        const limitNum = parseInt(limit.toString());
        const skip = (pageNum - 1) * limitNum;
        let whereClause = {
            plantId: plantId,
        };
        if (taskKey) {
            whereClause.taskKey = taskKey.toString();
        }
        if (preset) {
            whereClause.preset = preset.toString();
        }
        const [notes, totalCount] = await Promise.all([
            prisma_1.prisma.note.findMany({
                where: whereClause,
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limitNum,
            }),
            prisma_1.prisma.note.count({
                where: whereClause,
            }),
        ]);
        res.json({
            success: true,
            data: notes,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalCount,
                pages: Math.ceil(totalCount / limitNum),
            },
        });
    }
    catch (error) {
        console.error('Error fetching plant notes:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch plant notes',
        });
    }
});
router.post('/', jwtAuth_1.authenticateJWT, checkPlantOwnership, (0, validate_1.validate)(dtos_1.createNoteSchema), async (req, res) => {
    try {
        const plantId = req.params['plantId'];
        const validatedData = dtos_1.createNoteSchema.parse(req.body);
        const note = await prisma_1.prisma.note.create({
            data: {
                plantId: plantId,
                taskKey: validatedData.taskKey || null,
                body: validatedData.body,
                preset: validatedData.preset || null,
            },
        });
        res.status(201).json({
            success: true,
            data: note,
            message: 'Note created successfully',
        });
    }
    catch (error) {
        console.error('Error creating plant note:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors,
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to create plant note',
        });
    }
});
//# sourceMappingURL=plantNotes.js.map