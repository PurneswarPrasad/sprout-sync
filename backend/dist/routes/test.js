"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testRouter = void 0;
const express_1 = require("express");
const validate_1 = require("../middleware/validate");
const dtos_1 = require("../dtos");
const router = (0, express_1.Router)();
exports.testRouter = router;
router.post('/user', (0, validate_1.validate)(dtos_1.createUserSchema), (req, res) => {
    res.json({
        success: true,
        message: 'User validation passed',
        data: req.body,
    });
});
router.post('/plant', (0, validate_1.validate)(dtos_1.createPlantSchema), (req, res) => {
    res.json({
        success: true,
        message: 'Plant validation passed',
        data: req.body,
    });
});
router.post('/plant-task', (0, validate_1.validate)(dtos_1.createPlantTaskSchema), (req, res) => {
    res.json({
        success: true,
        message: 'PlantTask validation passed',
        data: req.body,
    });
});
router.post('/tag', (0, validate_1.validate)(dtos_1.createTagSchema), (req, res) => {
    res.json({
        success: true,
        message: 'Tag validation passed',
        data: req.body,
    });
});
router.post('/note', (0, validate_1.validate)(dtos_1.createNoteSchema), (req, res) => {
    res.json({
        success: true,
        message: 'Note validation passed',
        data: req.body,
    });
});
router.post('/photo', (0, validate_1.validate)(dtos_1.createPhotoSchema), (req, res) => {
    res.json({
        success: true,
        message: 'Photo validation passed',
        data: req.body,
    });
});
router.post('/notification', (0, validate_1.validate)(dtos_1.createNotificationLogSchema), (req, res) => {
    res.json({
        success: true,
        message: 'NotificationLog validation passed',
        data: req.body,
    });
});
router.put('/user-settings', (0, validate_1.validate)(dtos_1.updateUserSettingsSchema), (req, res) => {
    res.json({
        success: true,
        message: 'UserSettings validation passed',
        data: req.body,
    });
});
//# sourceMappingURL=test.js.map