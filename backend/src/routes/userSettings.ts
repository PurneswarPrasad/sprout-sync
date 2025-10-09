import { Router } from 'express';
import { z } from 'zod';
import { authenticateJWT } from '../middleware/jwtAuth';
import { validate } from '../middleware/validate';
import { prisma } from '../lib/prisma';

const router = Router();

// Validation schema for updating new user focus status
const updateNewUserFocusSchema = z.object({
  hasSeenNewUserFocus: z.boolean(),
});

// GET /api/user-settings - Get user settings including new user focus status
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const userId = (req.user as any).userId;
    
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId },
      select: {
        hasSeenNewUserFocus: true,
      }
    });

    if (!userSettings) {
      // User settings don't exist yet, create them with default values
      const newSettings = await prisma.userSettings.create({
        data: {
          userId,
          persona: 'PRIMARY',
          timezone: 'UTC',
          hasSeenNewUserFocus: false,
        },
        select: {
          hasSeenNewUserFocus: true,
        }
      });

      return res.json({
        success: true,
        data: newSettings,
      });
    }

    res.json({
      success: true,
      data: userSettings,
    });
  } catch (error) {
    console.error('Error getting user settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user settings',
    });
  }
});

// PUT /api/user-settings/new-user-focus - Update new user focus status
router.put('/new-user-focus', authenticateJWT, validate(updateNewUserFocusSchema), async (req, res) => {
  try {
    const userId = (req.user as any).userId;
    const { hasSeenNewUserFocus } = req.body;

    await prisma.userSettings.upsert({
      where: { userId },
      update: { hasSeenNewUserFocus },
      create: {
        userId,
        persona: 'PRIMARY',
        timezone: 'UTC',
        hasSeenNewUserFocus,
      }
    });

    res.json({
      success: true,
      message: 'New user focus status updated successfully',
    });
  } catch (error) {
    console.error('Error updating new user focus status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update new user focus status',
    });
  }
});

export { router as userSettingsRouter };
