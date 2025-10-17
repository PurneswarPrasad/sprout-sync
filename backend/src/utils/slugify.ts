import { prisma } from '../lib/prisma';

/**
 * Converts a string to a URL-friendly slug
 */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generates a unique username from a user's name
 */
export async function generateUniqueUsername(name: string): Promise<string> {
  if (!name) {
    return `user-${Date.now()}`;
  }

  // Extract first name
  const firstName = name.split(' ')[0] || name;;
  const baseUsername = toSlug(firstName);

  // Check if username is available
  const existingUser = await prisma.user.findUnique({
    where: { username: baseUsername },
  });

  if (!existingUser) {
    return baseUsername;
  }

  // Find next available username with suffix
  let suffix = 1;
  let username = `${baseUsername}-${suffix}`;

  while (await prisma.user.findUnique({ where: { username } })) {
    suffix++;
    username = `${baseUsername}-${suffix}`;
  }

  return username;
}

/**
 * Generates a unique plant slug for a user
 */
export async function generatePlantSlug(
  plantName: string,
  userId: string
): Promise<string> {
  if (!plantName) {
    return `plant-${Date.now()}`;
  }

  const baseSlug = toSlug(plantName);

  // Check if slug is available for this user
  const existingPlant = await prisma.plant.findFirst({
    where: {
      userId,
      slug: baseSlug,
    },
  });

  if (!existingPlant) {
    return baseSlug;
  }

  // Find next available slug with suffix
  let suffix = 1;
  let slug = `${baseSlug}-${suffix}`;

  while (
    await prisma.plant.findFirst({
      where: {
        userId,
        slug,
      },
    })
  ) {
    suffix++;
    slug = `${baseSlug}-${suffix}`;
  }

  return slug;
}

