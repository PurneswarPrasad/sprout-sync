"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const zod_1 = require("zod");
const aiService_1 = require("../services/aiService");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
exports.aiRouter = router;
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    },
});
const identifyByUrlSchema = zod_1.z.object({
    imageUrl: zod_1.z.string().url('Invalid image URL'),
});
router.post('/identify/file', auth_1.isAuthenticated, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No image file provided',
            });
        }
        const identification = await aiService_1.aiService.identifyPlantFromImage(req.file.buffer);
        res.json({
            success: true,
            data: identification,
            message: 'Plant identified successfully',
        });
    }
    catch (error) {
        console.error('AI identification error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to identify plant',
        });
    }
});
router.post('/identify/url', auth_1.isAuthenticated, (0, validate_1.validate)(identifyByUrlSchema), async (req, res) => {
    try {
        const { imageUrl } = req.body;
        const identification = await aiService_1.aiService.identifyPlantFromImage(imageUrl);
        res.json({
            success: true,
            data: identification,
            message: 'Plant identified successfully',
        });
    }
    catch (error) {
        console.error('AI identification error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to identify plant',
        });
    }
});
router.post('/identify', auth_1.isAuthenticated, upload.single('image'), async (req, res) => {
    try {
        let imageData;
        if (req.file) {
            imageData = req.file.buffer;
        }
        else if (req.body.imageUrl) {
            imageData = req.body.imageUrl;
        }
        else {
            return res.status(400).json({
                success: false,
                error: 'Either image file or imageUrl must be provided',
            });
        }
        const identification = await aiService_1.aiService.identifyPlantFromImage(imageData);
        res.json({
            success: true,
            data: identification,
            message: 'Plant identified successfully',
        });
    }
    catch (error) {
        console.error('AI identification error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to identify plant',
        });
    }
});
//# sourceMappingURL=ai.js.map