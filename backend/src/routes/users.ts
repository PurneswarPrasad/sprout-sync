import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticateJWT } from '../middleware/jwtAuth';
import { validate } from '../middleware/validate';
import { generateUniqueUsername, toSlug } from '../utils/slugify';

const router = Router();

// Schema for username update
const updateUsernameSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .max(30, 'Username must be 30 characters or less')
    .regex(
      /^[a-z0-9-]+$/,
      'Username can only contain lowercase letters, numbers, and hyphens'
    ),
});

// GET /api/users/profile - Get current user's profile
router.get('/profile', authenticateJWT, async (req, res) => {
  try {
    const userId = (req.user as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // If user doesn't have a username, generate one
    if (!user.username && user.name) {
      const username = await generateUniqueUsername(user.name);
      await prisma.user.update({
        where: { id: userId },
        data: { username },
      });
      user.username = username;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile',
    });
  }
});

// PATCH /api/users/username - Update username
router.patch(
  '/username',
  authenticateJWT,
  validate(updateUsernameSchema),
  async (req, res) => {
    try {
      const userId = (req.user as any).userId;
      const { username } = updateUsernameSchema.parse(req.body);

      // Convert to slug format
      const slugifiedUsername = toSlug(username);

      // Check if username is already taken
      const existingUser = await prisma.user.findUnique({
        where: { username: slugifiedUsername },
      });

      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({
          success: false,
          error: 'Username is already taken',
        });
      }

      // Update username
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { username: slugifiedUsername },
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      });

      res.json({
        success: true,
        data: updatedUser,
        message: 'Username updated successfully',
      });
    } catch (error) {
      console.error('Error updating username:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update username',
      });
    }
  }
);

export { router as usersRouter };

