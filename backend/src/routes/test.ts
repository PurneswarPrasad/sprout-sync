import { Router } from 'express';
import { validate } from '../middleware/validate';
import { 
  createUserSchema, 
  createPlantSchema, 
  createPlantTaskSchema,
  createTagSchema,
  createNoteSchema,
  createPhotoSchema,
  createNotificationLogSchema,
  updateUserSettingsSchema
} from '../dtos';

const router = Router();

// Test route for User DTO validation
router.post('/user', validate(createUserSchema), (req, res) => {
  res.json({
    success: true,
    message: 'User validation passed',
    data: req.body,
  });
});

// Test route for Plant DTO validation
router.post('/plant', validate(createPlantSchema), (req, res) => {
  res.json({
    success: true,
    message: 'Plant validation passed',
    data: req.body,
  });
});

// Test route for PlantTask DTO validation
router.post('/plant-task', validate(createPlantTaskSchema), (req, res) => {
  res.json({
    success: true,
    message: 'PlantTask validation passed',
    data: req.body,
  });
});

// Test route for Tag DTO validation
router.post('/tag', validate(createTagSchema), (req, res) => {
  res.json({
    success: true,
    message: 'Tag validation passed',
    data: req.body,
  });
});

// Test route for Note DTO validation
router.post('/note', validate(createNoteSchema), (req, res) => {
  res.json({
    success: true,
    message: 'Note validation passed',
    data: req.body,
  });
});

// Test route for Photo DTO validation
router.post('/photo', validate(createPhotoSchema), (req, res) => {
  res.json({
    success: true,
    message: 'Photo validation passed',
    data: req.body,
  });
});

// Test route for NotificationLog DTO validation
router.post('/notification', validate(createNotificationLogSchema), (req, res) => {
  res.json({
    success: true,
    message: 'NotificationLog validation passed',
    data: req.body,
  });
});

// Test route for UserSettings DTO validation
router.put('/user-settings', validate(updateUserSettingsSchema), (req, res) => {
  res.json({
    success: true,
    message: 'UserSettings validation passed',
    data: req.body,
  });
});

export { router as testRouter };

