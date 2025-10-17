"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSlug = toSlug;
exports.generateUniqueUsername = generateUniqueUsername;
exports.generatePlantSlug = generatePlantSlug;
const prisma_1 = require("../lib/prisma");
function toSlug(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
async function generateUniqueUsername(name) {
    if (!name) {
        return `user-${Date.now()}`;
    }
    const firstName = name.split(' ')[0] || name;
    ;
    const baseUsername = toSlug(firstName);
    const existingUser = await prisma_1.prisma.user.findUnique({
        where: { username: baseUsername },
    });
    if (!existingUser) {
        return baseUsername;
    }
    let suffix = 1;
    let username = `${baseUsername}-${suffix}`;
    while (await prisma_1.prisma.user.findUnique({ where: { username } })) {
        suffix++;
        username = `${baseUsername}-${suffix}`;
    }
    return username;
}
async function generatePlantSlug(plantName, userId) {
    if (!plantName) {
        return `plant-${Date.now()}`;
    }
    const baseSlug = toSlug(plantName);
    const existingPlant = await prisma_1.prisma.plant.findFirst({
        where: {
            userId,
            slug: baseSlug,
        },
    });
    if (!existingPlant) {
        return baseSlug;
    }
    let suffix = 1;
    let slug = `${baseSlug}-${suffix}`;
    while (await prisma_1.prisma.plant.findFirst({
        where: {
            userId,
            slug,
        },
    })) {
        suffix++;
        slug = `${baseSlug}-${suffix}`;
    }
    return slug;
}
//# sourceMappingURL=slugify.js.map