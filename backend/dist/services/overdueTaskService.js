"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.overdueTaskService = exports.OverdueTaskService = void 0;
const prisma_1 = require("../lib/prisma");
class OverdueTaskService {
    async findOverdueTasks() {
        try {
            const now = new Date();
            const overdueTasks = await prisma_1.prisma.plantTask.findMany({
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
            const transformedTasks = overdueTasks
                .filter(task => task.plant.user.settings?.fcmToken)
                .map(task => ({
                id: task.id,
                plantId: task.plant.id,
                plantName: task.plant.name,
                taskKey: task.taskKey,
                nextDueOn: task.nextDueOn,
                userId: task.plant.user.id,
                userPersona: task.plant.user.settings.persona,
                fcmToken: task.plant.user.settings.fcmToken
            }));
            console.log(`Found ${transformedTasks.length} overdue tasks for notification`);
            return transformedTasks;
        }
        catch (error) {
            console.error('Error finding overdue tasks:', error);
            return [];
        }
    }
    async findOverdueTasksForUser(userId) {
        try {
            const now = new Date();
            const overdueTasks = await prisma_1.prisma.plantTask.findMany({
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
            const transformedTasks = overdueTasks
                .filter(task => task.plant.user.settings?.fcmToken)
                .map(task => ({
                id: task.id,
                plantId: task.plant.id,
                plantName: task.plant.name,
                taskKey: task.taskKey,
                nextDueOn: task.nextDueOn,
                userId: task.plant.user.id,
                userPersona: task.plant.user.settings.persona,
                fcmToken: task.plant.user.settings.fcmToken
            }));
            return transformedTasks;
        }
        catch (error) {
            console.error('Error finding overdue tasks for user:', error);
            return [];
        }
    }
    async getOverdueTaskStats() {
        try {
            const now = new Date();
            const overdueTasks = await prisma_1.prisma.plantTask.findMany({
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
            const tasksByType = {};
            overdueTasks.forEach(task => {
                tasksByType[task.taskKey] = (tasksByType[task.taskKey] || 0) + 1;
            });
            return {
                totalOverdueTasks: overdueTasks.length,
                usersWithOverdueTasks: uniqueUsers.size,
                tasksByType
            };
        }
        catch (error) {
            console.error('Error getting overdue task stats:', error);
            return {
                totalOverdueTasks: 0,
                usersWithOverdueTasks: 0,
                tasksByType: {}
            };
        }
    }
    async getOverdueTasksGroupedByUser() {
        try {
            const overdueTasks = await this.findOverdueTasks();
            const tasksByUser = new Map();
            overdueTasks.forEach(task => {
                if (!tasksByUser.has(task.userId)) {
                    tasksByUser.set(task.userId, []);
                }
                tasksByUser.get(task.userId).push(task);
            });
            return tasksByUser;
        }
        catch (error) {
            console.error('Error grouping overdue tasks by user:', error);
            return new Map();
        }
    }
    async isTaskOverdue(taskId) {
        try {
            const task = await prisma_1.prisma.plantTask.findUnique({
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
        }
        catch (error) {
            console.error('Error checking if task is overdue:', error);
            return false;
        }
    }
    calculateNextDueDate(frequencyDays, lastCompletedOn) {
        const baseDate = lastCompletedOn || new Date();
        const nextDue = new Date(baseDate);
        nextDue.setDate(nextDue.getDate() + frequencyDays);
        return nextDue;
    }
    async markTaskCompleted(taskId) {
        try {
            const task = await prisma_1.prisma.plantTask.findUnique({
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
            await prisma_1.prisma.plantTask.update({
                where: { id: taskId },
                data: {
                    lastCompletedOn: now,
                    nextDueOn: nextDueOn
                }
            });
            console.log(`Task ${taskId} marked as completed, next due: ${nextDueOn}`);
        }
        catch (error) {
            console.error('Error marking task as completed:', error);
            throw error;
        }
    }
}
exports.OverdueTaskService = OverdueTaskService;
exports.overdueTaskService = new OverdueTaskService();
//# sourceMappingURL=overdueTaskService.js.map