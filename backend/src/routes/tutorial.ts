import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT } from '../middleware/jwtAuth';

const router = Router();
const prisma = new PrismaClient();

// Apply JWT authentication middleware to all routes
router.use(authenticateJWT);

// Get tutorial state
router.get('/state', async (req, res) => {
  try {
    const userId = (req.user as any)?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Get or create user settings
    let settings = await prisma.userSettings.findUnique({
      where: { userId },
      select: {
        tutorialCompleted: true,
        tutorialCompletedSteps: true,
        tutorialSkippedSteps: true,
      }
    });

    // If no settings exist yet, return default state
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
  } catch (error) {
    console.error('Error fetching tutorial state:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch tutorial state'
    });
  }
});

// Update tutorial state
router.post('/state', async (req, res) => {
  try {
    const userId = (req.user as any)?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { completedSteps, skippedSteps, hasCompletedTutorial } = req.body;

    // Validate input
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

    // Get or create user settings
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
  } catch (error) {
    console.error('Error updating tutorial state:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update tutorial state'
    });
  }
});

// Mark tutorial as completed
router.post('/complete', async (req, res) => {
  try {
    const userId = (req.user as any)?.userId;

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
  } catch (error) {
    console.error('Error completing tutorial:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to complete tutorial'
    });
  }
});

export default router;

