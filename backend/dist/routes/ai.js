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
const jwtAuth_1 = require("../middleware/jwtAuth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
exports.aiRouter = router;
router.get('/health', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const apiKey = process.env['GEMINI_API_KEY'];
        if (!apiKey) {
            return res.status(500).json({
                success: false,
                error: 'GEMINI_API_KEY not configured',
            });
        }
        res.json({
            success: true,
            message: 'AI service is healthy',
            apiKeyConfigured: !!apiKey,
        });
    }
    catch (error) {
        console.error('AI health check error:', error);
        res.status(500).json({
            success: false,
            error: 'AI service health check failed',
        });
    }
});
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
router.post('/identify/file', jwtAuth_1.authenticateJWT, upload.single('image'), async (req, res) => {
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
router.post('/identify/url', jwtAuth_1.authenticateJWT, (0, validate_1.validate)(identifyByUrlSchema), async (req, res) => {
    try {
        const { imageUrl } = req.body;
        console.log(`Received URL identification request for: ${imageUrl}`);
        const identification = await aiService_1.aiService.identifyPlantFromImage(imageUrl);
        res.json({
            success: true,
            data: identification,
            message: 'Plant identified successfully',
        });
    }
    catch (error) {
        console.error('AI identification error:', error);
        let errorMessage = 'Failed to identify plant';
        if (error instanceof Error) {
            if (error.message.includes('fetch')) {
                errorMessage = 'Failed to fetch image from URL. Please check the URL and try again.';
            }
            else if (error.message.includes('Invalid content type')) {
                errorMessage = 'The URL does not point to a valid image file. Please use a direct image URL (ending in .jpg, .png, etc.) instead of a search engine page.';
            }
            else if (error.message.includes('GEMINI_API_KEY')) {
                errorMessage = 'AI service is not properly configured.';
            }
            else {
                errorMessage = error.message;
            }
        }
        res.status(500).json({
            success: false,
            error: errorMessage,
        });
    }
});
//# sourceMappingURL=ai.js.map