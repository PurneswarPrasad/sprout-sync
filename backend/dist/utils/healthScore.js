"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateHealthScore = calculateHealthScore;
exports.calculateCareStreak = calculateCareStreak;
exports.getBadgeTier = getBadgeTier;
function calculateHealthScore(tasks) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let totalOverdueDays = 0;
    for (const task of tasks) {
        if (!task.active)
            continue;
        const dueDate = new Date(task.nextDueOn);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate < today) {
            const diffTime = today.getTime() - dueDate.getTime();
            const overdueDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            totalOverdueDays += overdueDays;
        }
    }
    const healthScore = Math.max(0, 100 - totalOverdueDays);
    return healthScore;
}
function calculateCareStreak(tasks, createdAt) {
    if (tasks.length === 0) {
        return 0;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const plantCreatedDate = new Date(createdAt);
    plantCreatedDate.setHours(0, 0, 0, 0);
    const daysSinceCreation = Math.floor((today.getTime() - plantCreatedDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceCreation === 0) {
        return 1;
    }
    let currentStreak = 0;
    const activeTasks = tasks.filter((task) => task.active);
    if (activeTasks.length === 0) {
        return daysSinceCreation + 1;
    }
    let hasOverdueTask = false;
    for (const task of activeTasks) {
        const dueDate = new Date(task.nextDueOn);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate < today) {
            hasOverdueTask = true;
            break;
        }
    }
    if (!hasOverdueTask) {
        currentStreak = daysSinceCreation + 1;
    }
    else {
        currentStreak = 1;
    }
    return currentStreak;
}
function getBadgeTier(streak) {
    if (streak >= 100) {
        return {
            name: 'Evergreen Legend',
            quote: "Legendary, you're on your way to a greener world!",
            image: '/badges/evergreen-legend.png',
        };
    }
    else if (streak >= 60) {
        return {
            name: 'Master Grower',
            quote: 'Master of the Flora.',
            image: '/badges/master-grower.png',
        };
    }
    else if (streak >= 30) {
        return {
            name: 'Bloom Buddy',
            quote: 'Your plant is thriving — and so is your routine!',
            image: '/badges/bloom-buddy.png',
        };
    }
    else if (streak >= 7) {
        return {
            name: 'Green Guardian',
            quote: "You've built a steady habit. Your plant trusts you.",
            image: '/badges/green-guardian.png',
        };
    }
    else {
        return {
            name: 'Sprout Starter',
            quote: 'Your plant is just getting started — and so are you!',
            image: '/badges/sprout-starter.png',
        };
    }
}
//# sourceMappingURL=healthScore.js.map