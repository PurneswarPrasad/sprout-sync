"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const jwtAuth_1 = require("../middleware/jwtAuth");
const cloudinaryService_1 = require("../services/cloudinaryService");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/heic',
            'image/heif'
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only JPG, PNG, WebP, HEIC, and HEIF are allowed.'));
        }
    },
});
router.post('/image', jwtAuth_1.authenticateJWT, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No image file provided',
            });
        }
        const result = await cloudinaryService_1.CloudinaryService.uploadImage(req.file.buffer, 'plant-care');
        const optimizedUrl = result.secure_url.replace('/upload/', '/upload/w_800,h_800,c_limit,q_auto:good,f_auto/');
        res.json({
            success: true,
            data: {
                public_id: result.public_id,
                original_url: result.secure_url,
                optimized_url: optimizedUrl,
                width: result.width,
                height: result.height,
                format: result.format,
                size: req.file.size,
            },
            message: 'Image uploaded successfully',
        });
    }
    catch (error) {
        console.error('Error uploading image:', error);
        if (error instanceof Error && error.message.includes('Invalid file type')) {
            return res.status(400).json({
                success: false,
                error: error.message,
            });
        }
        if (error instanceof Error && error.message.includes('File too large')) {
            return res.status(400).json({
                success: false,
                error: 'File size too large. Maximum size is 5MB.',
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to upload image',
        });
    }
});
router.delete('/image/*', jwtAuth_1.authenticateJWT, async (req, res) => {
    try {
        const publicId = req.params[0];
        if (!publicId) {
            return res.status(400).json({
                success: false,
                error: 'Public ID is required',
            });
        }
        console.log('Deleting image with publicId:', publicId);
        await cloudinaryService_1.CloudinaryService.deleteImage(publicId);
        res.json({
            success: true,
            message: 'Image deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete image',
        });
    }
});
exports.default = router;
//# sourceMappingURL=upload.js.map