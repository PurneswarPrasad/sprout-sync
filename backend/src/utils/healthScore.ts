import { PlantTask } from '@prisma/client';

/**
 * Calculates the health score for a plant based on overdue tasks
 * Start at 100, subtract 1 point for each day a task is overdue
 */
export function calculateHealthScore(tasks: PlantTask[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let totalOverdueDays = 0;

  for (const task of tasks) {
    if (!task.active) continue;

    const dueDate = new Date(task.nextDueOn);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate < today) {
      // Task is overdue
      const diffTime = today.getTime() - dueDate.getTime();
      const overdueDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      totalOverdueDays += overdueDays;
    }
  }

  const healthScore = Math.max(0, 100 - totalOverdueDays);
  return healthScore;
}

/**
 * Calculates the care streak (consecutive days of perfect care)
 * Based on task completion history
 */
export function calculateCareStreak(tasks: PlantTask[], createdAt: Date): number {
  if (tasks.length === 0) {
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const plantCreatedDate = new Date(createdAt);
  plantCreatedDate.setHours(0, 0, 0, 0);

  // Calculate days since plant was added
  const daysSinceCreation = Math.floor(
    (today.getTime() - plantCreatedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // If plant was just added today, streak is 1
  if (daysSinceCreation === 0) {
    return 1;
  }

  // Check if all current tasks are up to date
  let currentStreak = 0;
  const activeTasks = tasks.filter((task) => task.active);

  if (activeTasks.length === 0) {
    return daysSinceCreation + 1; // All days since creation
  }

  // Simple heuristic: if no tasks are overdue, the streak is the days since creation
  // If any task is overdue, streak is broken
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
    // All tasks are up to date - streak is days since creation
    currentStreak = daysSinceCreation + 1;
  } else {
    // When tasks are overdue, streak is broken
    // Since we don't track lastCompletedOn, we set streak to 1
    currentStreak = 1;
  }

  return currentStreak;
}

/**
 * Determines badge tier based on care streak
 */
export function getBadgeTier(streak: number): {
  name: string;
  quote: string;
  image: string;
} {
  if (streak >= 100) {
    return {
      name: 'Evergreen Legend',
      quote: "Legendary, you're on your way to a greener world!",
      image: '/badges/evergreen-legend.png',
    };
  } else if (streak >= 60) {
    return {
      name: 'Master Grower',
      quote: 'Master of the Flora.',
      image: '/badges/master-grower.png',
    };
  } else if (streak >= 30) {
    return {
      name: 'Bloom Buddy',
      quote: 'Your plant is thriving — and so is your routine!',
      image: '/badges/bloom-buddy.png',
    };
  } else if (streak >= 7) {
    return {
      name: 'Green Guardian',
      quote: "You've built a steady habit. Your plant trusts you.",
      image: '/badges/green-guardian.png',
    };
  } else {
    return {
      name: 'Sprout Starter',
      quote: 'Your plant is just getting started — and so are you!',
      image: '/badges/sprout-starter.png',
    };
  }
}

