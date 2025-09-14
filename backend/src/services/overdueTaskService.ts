import { prisma } from '../lib/prisma';
import { OverdueTask } from './firebaseNotificationService';

export class OverdueTaskService {
  /**
   * Find all overdue tasks for users who have FCM tokens
   */
  async findOverdueTasks(): Promise<OverdueTask[]> {
    try {
      const now = new Date();
      
      // Find all overdue tasks with user settings that have FCM tokens
      const overdueTasks = await prisma.plantTask.findMany({
        where: {
          active: true,
          nextDueOn: {
            lte: now // Tasks that are due or overdue
          },
          plant: {
            user: {
              settings: {
                fcmToken: {
                  not: null // Only users with FCM tokens
                }
              }
            }
          }
        },
        include: {
          plant: {
            select: {
              id: true,
              name: true,
              user: {
                select: {
                  id: true,
                  settings: {
                    select: {
                      fcmToken: true,
                      persona: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          nextDueOn: 'asc' // Oldest overdue tasks first
        }
      });

      // Transform to OverdueTask format
      const transformedTasks: OverdueTask[] = overdueTasks
        .filter(task => task.plant.user.settings?.fcmToken) // Double-check FCM token exists
        .map(task => ({
          id: task.id,
          plantId: task.plant.id,
          plantName: task.plant.name,
          taskKey: task.taskKey,
          nextDueOn: task.nextDueOn,
          userId: task.plant.user.id,
          userPersona: task.plant.user.settings!.persona,
          fcmToken: task.plant.user.settings!.fcmToken!
        }));

      console.log(`Found ${transformedTasks.length} overdue tasks for notification`);
      return transformedTasks;
    } catch (error) {
      console.error('Error finding overdue tasks:', error);
      return [];
    }
  }

  /**
   * Find overdue tasks for a specific user
   */
  async findOverdueTasksForUser(userId: string): Promise<OverdueTask[]> {
    try {
      const now = new Date();
      
      const overdueTasks = await prisma.plantTask.findMany({
        where: {
          active: true,
          nextDueOn: {
            lte: now
          },
          plant: {
            userId: userId,
            user: {
              settings: {
                fcmToken: {
                  not: null
                }
              }
            }
          }
        },
        include: {
          plant: {
            select: {
              id: true,
              name: true,
              user: {
                select: {
                  id: true,
                  settings: {
                    select: {
                      fcmToken: true,
                      persona: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          nextDueOn: 'asc'
        }
      });

      const transformedTasks: OverdueTask[] = overdueTasks
        .filter(task => task.plant.user.settings?.fcmToken)
        .map(task => ({
          id: task.id,
          plantId: task.plant.id,
          plantName: task.plant.name,
          taskKey: task.taskKey,
          nextDueOn: task.nextDueOn,
          userId: task.plant.user.id,
          userPersona: task.plant.user.settings!.persona,
          fcmToken: task.plant.user.settings!.fcmToken!
        }));

      return transformedTasks;
    } catch (error) {
      console.error('Error finding overdue tasks for user:', error);
      return [];
    }
  }

  /**
   * Get statistics about overdue tasks
   */
  async getOverdueTaskStats(): Promise<{
    totalOverdueTasks: number;
    usersWithOverdueTasks: number;
    tasksByType: Record<string, number>;
  }> {
    try {
      const now = new Date();
      
      const overdueTasks = await prisma.plantTask.findMany({
        where: {
          active: true,
          nextDueOn: {
            lte: now
          },
          plant: {
            user: {
              settings: {
                fcmToken: {
                  not: null
                }
              }
            }
          }
        },
        include: {
          plant: {
            select: {
              user: {
                select: {
                  id: true
                }
              }
            }
          }
        }
      });

      const uniqueUsers = new Set(overdueTasks.map(task => task.plant.user.id));
      const tasksByType: Record<string, number> = {};

      overdueTasks.forEach(task => {
        tasksByType[task.taskKey] = (tasksByType[task.taskKey] || 0) + 1;
      });

      return {
        totalOverdueTasks: overdueTasks.length,
        usersWithOverdueTasks: uniqueUsers.size,
        tasksByType
      };
    } catch (error) {
      console.error('Error getting overdue task stats:', error);
      return {
        totalOverdueTasks: 0,
        usersWithOverdueTasks: 0,
        tasksByType: {}
      };
    }
  }

  /**
   * Get overdue tasks grouped by user for notification cycling
   */
  async getOverdueTasksGroupedByUser(): Promise<Map<string, OverdueTask[]>> {
    try {
      const overdueTasks = await this.findOverdueTasks();
      const tasksByUser = new Map<string, OverdueTask[]>();

      overdueTasks.forEach(task => {
        if (!tasksByUser.has(task.userId)) {
          tasksByUser.set(task.userId, []);
        }
        tasksByUser.get(task.userId)!.push(task);
      });

      return tasksByUser;
    } catch (error) {
      console.error('Error grouping overdue tasks by user:', error);
      return new Map();
    }
  }

  /**
   * Check if a specific task is overdue
   */
  async isTaskOverdue(taskId: string): Promise<boolean> {
    try {
      const task = await prisma.plantTask.findUnique({
        where: { id: taskId },
        select: {
          nextDueOn: true,
          active: true
        }
      });

      if (!task || !task.active) {
        return false;
      }

      return task.nextDueOn <= new Date();
    } catch (error) {
      console.error('Error checking if task is overdue:', error);
      return false;
    }
  }

  /**
   * Get the next due date for a task after completion
   */
  calculateNextDueDate(frequencyDays: number, lastCompletedOn?: Date): Date {
    const baseDate = lastCompletedOn || new Date();
    const nextDue = new Date(baseDate);
    nextDue.setDate(nextDue.getDate() + frequencyDays);
    return nextDue;
  }

  /**
   * Mark a task as completed and update next due date
   */
  async markTaskCompleted(taskId: string): Promise<void> {
    try {
      const task = await prisma.plantTask.findUnique({
        where: { id: taskId },
        select: {
          frequencyDays: true,
          lastCompletedOn: true
        }
      });

      if (!task) {
        throw new Error('Task not found');
      }

      const now = new Date();
      const nextDueOn = this.calculateNextDueDate(task.frequencyDays, now);

      await prisma.plantTask.update({
        where: { id: taskId },
        data: {
          lastCompletedOn: now,
          nextDueOn: nextDueOn
        }
      });

      console.log(`Task ${taskId} marked as completed, next due: ${nextDueOn}`);
    } catch (error) {
      console.error('Error marking task as completed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const overdueTaskService = new OverdueTaskService();

