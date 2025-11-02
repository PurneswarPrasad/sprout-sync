import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { authenticateJWT } from '../middleware/jwtAuth';
import { resolveUserTimezone, startOfDayInTimezone } from '../utils/timezone';

const router = Router();

// Schema for creating a plant gift
const createGiftSchema = z.object({
  plantId: z.string().uuid(),
  message: z.string().optional(),
});

// Schema for accepting a plant gift
const acceptGiftSchema = z.object({
  giftToken: z.string(),
});

// POST /api/plant-gifts - Create a plant gift
router.post('/', authenticateJWT, validate(createGiftSchema), async (req, res) => {
  try {
    const { plantId, message } = req.body;
    const senderId = (req.user as any).userId;

    // Check if plant exists and belongs to the user
    const plant = await prisma.plant.findFirst({
      where: {
        id: plantId,
        userId: senderId,
      },
      include: {
        tasks: true,
        photos: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!plant) {
      return res.status(404).json({
        success: false,
        error: 'Plant not found or you do not own this plant',
      });
    }

    // Check if plant is already gifted
    if (plant.isGifted) {
      return res.status(400).json({
        success: false,
        error: 'This plant has already been gifted',
      });
    }

    // Create the gift
    const gift = await prisma.plantGift.create({
      data: {
        plantId,
        senderId,
        message: message || null,
      },
      include: {
        plant: {
          include: {
            tasks: true,
            photos: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Mark plant as gifted
    await prisma.plant.update({
      where: { id: plantId },
      data: { isGifted: true },
    });

    res.status(201).json({
      success: true,
      data: gift,
      message: 'Plant gift created successfully',
    });
  } catch (error) {
    console.error('Error creating plant gift:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create plant gift',
    });
  }
});

// GET /api/plant-gifts/gift/:token - Get gift details by token (for accepting)
router.get('/gift/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const gift = await prisma.plantGift.findFirst({
      where: {
        giftToken: token,
        status: 'PENDING',
      },
      include: {
        plant: {
          include: {
            tasks: true,
            photos: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!gift) {
      return res.status(404).json({
        success: false,
        error: 'Gift not found or has already been claimed',
      });
    }

    // Check if gift has expired
    if (gift.expiresAt && new Date() > gift.expiresAt) {
      await prisma.plantGift.update({
        where: { id: gift.id },
        data: { status: 'EXPIRED' },
      });

      return res.status(410).json({
        success: false,
        error: 'This gift has expired',
      });
    }

    res.json({
      success: true,
      data: gift,
    });
  } catch (error) {
    console.error('Error fetching gift:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch gift',
    });
  }
});

// POST /api/plant-gifts/accept - Accept a plant gift
router.post('/accept', authenticateJWT, validate(acceptGiftSchema), async (req, res) => {
  try {
    const { giftToken } = req.body;
    const receiverId = (req.user as any).userId;

    // Get the gift
    const gift = await prisma.plantGift.findFirst({
      where: {
        giftToken,
        status: 'PENDING',
      },
      include: {
        plant: {
          include: {
            tasks: true,
            photos: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!gift) {
      return res.status(404).json({
        success: false,
        error: 'Gift not found or has already been claimed',
      });
    }

    // Check if user is trying to accept their own gift
    if (gift.senderId === receiverId) {
      return res.status(400).json({
        success: false,
        error: 'You cannot accept your own gifts',
      });
    }

    // Check if gift has expired
    if (gift.expiresAt && new Date() > gift.expiresAt) {
      await prisma.plantGift.update({
        where: { id: gift.id },
        data: { status: 'EXPIRED' },
      });

      return res.status(410).json({
        success: false,
        error: 'This gift has expired',
      });
    }

    const receiverTimezone = await resolveUserTimezone(receiverId, req.headers['x-user-timezone']);
    const acceptanceMoment = new Date();

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Update the gift status
      const updatedGift = await tx.plantGift.update({
        where: { id: gift.id },
        data: {
          status: 'ACCEPTED',
          receiverId,
          acceptedAt: acceptanceMoment,
        },
      });

      // Create a new plant for the receiver with all the original data
      const newPlant = await tx.plant.create({
        data: {
          userId: receiverId,
          petName: gift.plant.petName,
          botanicalName: gift.plant.botanicalName,
          commonName: gift.plant.commonName,
          type: gift.plant.type,
          acquisitionDate: gift.plant.acquisitionDate,
          city: gift.plant.city,
          careLevel: gift.plant.careLevel as any,
          sunRequirements: gift.plant.sunRequirements as any,
          toxicityLevel: gift.plant.toxicityLevel as any,
          petFriendliness: gift.plant.petFriendliness as any,
          commonPestsAndDiseases: gift.plant.commonPestsAndDiseases,
          preventiveMeasures: gift.plant.preventiveMeasures,
          isGifted: false, // New plant is not gifted
        },
      });

      // Copy all tasks - set nextDueOn to today's start in receiver's timezone
      if (gift.plant.tasks.length > 0) {
        const todaysStart = startOfDayInTimezone(receiverTimezone, acceptanceMoment);
        
        await tx.plantTask.createMany({
          data: gift.plant.tasks.map(task => ({
            plantId: newPlant.id,
            taskKey: task.taskKey,
            frequencyDays: task.frequencyDays,
            nextDueOn: todaysStart,
            active: task.active,
          })),
        });
      }

      // Copy all photos
      if (gift.plant.photos.length > 0) {
        await tx.photo.createMany({
          data: gift.plant.photos.map(photo => ({
            plantId: newPlant.id,
            cloudinaryPublicId: photo.cloudinaryPublicId,
            secureUrl: photo.secureUrl,
            takenAt: photo.takenAt,
            pointsAwarded: photo.pointsAwarded,
          })),
        });
      }

      // Copy all tags (create new tags for the receiver)
      if (gift.plant.tags.length > 0) {
        for (const plantTag of gift.plant.tags) {
          // Check if tag already exists for the receiver
          let receiverTag = await tx.tag.findFirst({
            where: {
              userId: receiverId,
              name: plantTag.tag.name,
            },
          });

          // Create tag if it doesn't exist
          if (!receiverTag) {
            receiverTag = await tx.tag.create({
              data: {
                userId: receiverId,
                name: plantTag.tag.name,
                colorHex: plantTag.tag.colorHex,
              },
            });
          }

          // Link plant to tag
          await tx.plantTag.create({
            data: {
              plantId: newPlant.id,
              tagId: receiverTag.id,
            },
          });
        }
      }

      return { updatedGift, newPlant };
    });

    res.json({
      success: true,
      data: result,
      message: 'Plant gift accepted successfully',
    });
  } catch (error) {
    console.error('Error accepting plant gift:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept plant gift',
    });
  }
});

// GET /api/plant-gifts/sent - Get gifts sent by the user
router.get('/sent', authenticateJWT, async (req, res) => {
  try {
    const senderId = (req.user as any).userId;

    const gifts = await prisma.plantGift.findMany({
      where: { senderId },
      include: {
        plant: {
          include: {
            tasks: true,
            photos: {
              orderBy: {
                takenAt: 'desc',
              },
              take: 1,
            },
            _count: {
              select: {
                notes: true,
                photos: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: gifts,
      count: gifts.length,
    });
  } catch (error) {
    console.error('Error fetching sent gifts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sent gifts',
    });
  }
});

// GET /api/plant-gifts/received - Get gifts received by the user
router.get('/received', authenticateJWT, async (req, res) => {
  try {
    const receiverId = (req.user as any).userId;

    const gifts = await prisma.plantGift.findMany({
      where: { 
        receiverId,
        status: 'ACCEPTED',
      },
      include: {
        plant: {
          include: {
            tasks: true,
            photos: {
              orderBy: {
                takenAt: 'desc',
              },
              take: 1,
            },
            _count: {
              select: {
                notes: true,
                photos: true,
              },
            },
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        acceptedAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: gifts,
      count: gifts.length,
    });
  } catch (error) {
    console.error('Error fetching received gifts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch received gifts',
    });
  }
});

// DELETE /api/plant-gifts/:id - Cancel a gift
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const giftId = req.params['id'];
    if (!giftId) {
      return res.status(400).json({
        success: false,
        error: 'Gift ID is required',
      });
    }
    
    const userId = (req.user as any).userId;

    const gift = await prisma.plantGift.findFirst({
      where: {
        id: giftId,
        senderId: userId,
        status: 'PENDING',
      },
    });

    if (!gift) {
      return res.status(404).json({
        success: false,
        error: 'Gift not found or cannot be cancelled',
      });
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Cancel the gift
      await tx.plantGift.update({
        where: { id: giftId },
        data: { status: 'CANCELLED' },
      });

      // Mark plant as not gifted
      await tx.plant.update({
        where: { id: gift.plantId },
        data: { isGifted: false },
      });
    });

    res.json({
      success: true,
      message: 'Gift cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling gift:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel gift',
    });
  }
});

export { router as plantGiftsRouter };
