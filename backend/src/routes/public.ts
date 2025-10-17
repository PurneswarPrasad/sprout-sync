import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { calculateHealthScore, calculateCareStreak, getBadgeTier } from '../utils/healthScore';

const router = Router();

// GET /api/public/u/:username/:plantSlug - Get public plant profile
router.get('/u/:username/:plantSlug', async (req, res) => {
  try {
    const { username, plantSlug } = req.params;

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Find plant by slug
    const plant = await prisma.plant.findFirst({
      where: {
        userId: user.id,
        slug: plantSlug,
      },
      include: {
        tasks: {
          where: { active: true },
          orderBy: { taskKey: 'asc' },
        },
        photos: {
          orderBy: { takenAt: 'desc' },
          take: 1,
        },
        appreciations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!plant) {
      return res.status(404).json({
        success: false,
        error: 'Plant not found',
      });
    }

    // Calculate health score and care streak
    const healthScore = calculateHealthScore(plant.tasks);
    const careStreak = calculateCareStreak(plant.tasks, plant.createdAt);
    const badge = getBadgeTier(careStreak);

    // Calculate days thriving (days since creation)
    const today = new Date();
    const createdDate = new Date(plant.createdAt);
    const daysThriving = Math.floor(
      (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    res.json({
      success: true,
      data: {
        plant: {
          id: plant.id,
          petName: plant.petName,
          botanicalName: plant.botanicalName,
          commonName: plant.commonName,
          slug: plant.slug,
          type: plant.type,
          city: plant.city,
          careLevel: plant.careLevel,
          sunRequirements: plant.sunRequirements,
          createdAt: plant.createdAt,
          photo: plant.photos[0] || null,
        },
        owner: plant.user,
        tasks: plant.tasks,
        healthScore,
        careStreak,
        daysThriving,
        badge,
        appreciations: {
          count: plant.appreciations.length,
          users: plant.appreciations.map((a) => a.user),
        },
        comments: plant.comments.map((c) => ({
          id: c.id,
          comment: c.comment,
          createdAt: c.createdAt,
          user: c.user,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching public plant profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plant profile',
    });
  }
});

export { router as publicRouter };

