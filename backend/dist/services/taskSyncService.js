"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskSyncService = exports.TaskSyncService = void 0;
const prisma_1 = require("../lib/prisma");
const googleCalendarService_1 = require("./googleCalendarService");
class TaskSyncService {
    async syncTaskToCalendar(taskId) {
        try {
            const task = await prisma_1.prisma.plantTask.findUnique({
                where: { id: taskId },
                select: {
                    id: true,
                    plantId: true,
                    taskKey: true,
                    frequencyDays: true,
                    nextDueOn: true,
                    lastCompletedOn: true,
                    active: true,
                    googleCalendarEventId: true,
                    plant: {
                        select: {
                            id: true,
                            userId: true,
                            petName: true,
                            botanicalName: true,
                            commonName: true,
                            type: true,
                        },
                    },
                },
            });
            if (!task || !task.active) {
                return;
            }
            const userSettings = await prisma_1.prisma.userSettings.findUnique({
                where: { userId: task.plant.userId },
                select: {
                    googleCalendarSyncEnabled: true,
                    googleCalendarReminderMinutes: true,
                    syncedPlantIds: true,
                    googleCalendarAccessToken: true,
                },
            });
            if (!userSettings?.googleCalendarSyncEnabled ||
                !userSettings.googleCalendarAccessToken ||
                !userSettings.syncedPlantIds?.includes(task.plantId)) {
                return;
            }
            const hasValidAccess = await googleCalendarService_1.googleCalendarService.hasValidAccess(task.plant.userId);
            if (!hasValidAccess) {
                console.warn(`User ${task.plant.userId} has invalid Google Calendar access`);
                return;
            }
            const eventId = await googleCalendarService_1.googleCalendarService.createTaskEvent(task.plant.userId, task, userSettings.googleCalendarReminderMinutes);
            await prisma_1.prisma.plantTask.update({
                where: { id: taskId },
                data: { googleCalendarEventId: eventId },
            });
            console.log(`Successfully synced task ${taskId} to Google Calendar`);
        }
        catch (error) {
            console.error(`Error syncing task ${taskId} to Google Calendar:`, error);
        }
    }
    async updateTaskInCalendar(taskId, eventId) {
        try {
            const task = await prisma_1.prisma.plantTask.findUnique({
                where: { id: taskId },
                select: {
                    id: true,
                    plantId: true,
                    taskKey: true,
                    frequencyDays: true,
                    nextDueOn: true,
                    lastCompletedOn: true,
                    active: true,
                    googleCalendarEventId: true,
                    plant: {
                        select: {
                            id: true,
                            userId: true,
                            petName: true,
                            botanicalName: true,
                            commonName: true,
                            type: true,
                        },
                    },
                },
            });
            if (!task || !task.active) {
                return;
            }
            const userSettings = await prisma_1.prisma.userSettings.findUnique({
                where: { userId: task.plant.userId },
                select: {
                    googleCalendarSyncEnabled: true,
                    googleCalendarReminderMinutes: true,
                    syncedPlantIds: true,
                    googleCalendarAccessToken: true,
                },
            });
            if (!userSettings?.googleCalendarSyncEnabled ||
                !userSettings.googleCalendarAccessToken ||
                !userSettings.syncedPlantIds?.includes(task.plantId)) {
                return;
            }
            const hasValidAccess = await googleCalendarService_1.googleCalendarService.hasValidAccess(task.plant.userId);
            if (!hasValidAccess) {
                console.warn(`User ${task.plant.userId} has invalid Google Calendar access`);
                return;
            }
            const reminder = userSettings.googleCalendarReminderMinutes;
            const storedEventId = eventId || task.googleCalendarEventId;
            if (storedEventId) {
                try {
                    await googleCalendarService_1.googleCalendarService.updateTaskEvent(task.plant.userId, storedEventId, task, reminder);
                    await prisma_1.prisma.plantTask.update({
                        where: { id: taskId },
                        data: { googleCalendarEventId: storedEventId },
                    });
                }
                catch (updateError) {
                    console.warn(`Error updating event ${storedEventId} for task ${taskId}, recreating`, updateError);
                    const newEventId = await googleCalendarService_1.googleCalendarService.createTaskEvent(task.plant.userId, task, reminder);
                    await prisma_1.prisma.plantTask.update({
                        where: { id: taskId },
                        data: { googleCalendarEventId: newEventId },
                    });
                }
            }
            else {
                const newEventId = await googleCalendarService_1.googleCalendarService.createTaskEvent(task.plant.userId, task, reminder);
                await prisma_1.prisma.plantTask.update({
                    where: { id: taskId },
                    data: { googleCalendarEventId: newEventId },
                });
            }
            console.log(`Successfully updated task ${taskId} in Google Calendar`);
        }
        catch (error) {
            console.error(`Error updating task ${taskId} in Google Calendar:`, error);
        }
    }
    async removeTaskFromCalendar(taskId, eventId) {
        try {
            const task = await prisma_1.prisma.plantTask.findUnique({
                where: { id: taskId },
                select: {
                    id: true,
                    plantId: true,
                    googleCalendarEventId: true,
                    plant: {
                        select: {
                            id: true,
                            userId: true,
                        },
                    },
                },
            });
            if (!task) {
                return;
            }
            const userSettings = await prisma_1.prisma.userSettings.findUnique({
                where: { userId: task.plant.userId },
                select: {
                    googleCalendarAccessToken: true,
                },
            });
            if (!userSettings?.googleCalendarAccessToken) {
                return;
            }
            const hasValidAccess = await googleCalendarService_1.googleCalendarService.hasValidAccess(task.plant.userId);
            if (!hasValidAccess) {
                console.warn(`User ${task.plant.userId} has invalid Google Calendar access`);
                return;
            }
            const targetEventId = eventId || task.googleCalendarEventId;
            if (targetEventId) {
                await googleCalendarService_1.googleCalendarService.deleteTaskEvent(task.plant.userId, targetEventId);
            }
            await prisma_1.prisma.plantTask.update({
                where: { id: taskId },
                data: { googleCalendarEventId: null },
            });
            console.log(`Successfully removed task ${taskId} from Google Calendar`);
        }
        catch (error) {
            console.error(`Error removing task ${taskId} from Google Calendar:`, error);
        }
    }
    async syncTasksForPlants(userId, plantIds, reminderMinutes, removeUnsynced = false) {
        let successCount = 0;
        let failureCount = 0;
        try {
            if (!plantIds || plantIds.length === 0) {
                return { successCount, failureCount };
            }
            const userSettings = await prisma_1.prisma.userSettings.findUnique({
                where: { userId },
                select: {
                    googleCalendarReminderMinutes: true,
                    googleCalendarAccessToken: true,
                },
            });
            if (!userSettings?.googleCalendarAccessToken) {
                console.warn(`User ${userId} does not have Google Calendar access token`);
                return { successCount, failureCount };
            }
            const hasValidAccess = await googleCalendarService_1.googleCalendarService.hasValidAccess(userId);
            if (!hasValidAccess) {
                console.warn(`User ${userId} has invalid Google Calendar access`);
                return { successCount, failureCount };
            }
            const reminder = reminderMinutes ?? userSettings.googleCalendarReminderMinutes;
            const tasks = await prisma_1.prisma.plantTask.findMany({
                where: {
                    plant: { userId },
                    active: true,
                    plantId: { in: plantIds },
                },
                select: {
                    id: true,
                    plantId: true,
                    taskKey: true,
                    frequencyDays: true,
                    nextDueOn: true,
                    lastCompletedOn: true,
                    googleCalendarEventId: true,
                    plant: {
                        select: {
                            id: true,
                            userId: true,
                            petName: true,
                            botanicalName: true,
                            commonName: true,
                            type: true,
                        },
                    },
                },
            });
            for (const task of tasks) {
                try {
                    if (!removeUnsynced) {
                        if (task.googleCalendarEventId) {
                            await googleCalendarService_1.googleCalendarService.updateTaskEvent(userId, task.googleCalendarEventId, task, reminder);
                        }
                        else {
                            const eventId = await googleCalendarService_1.googleCalendarService.createTaskEvent(userId, task, reminder);
                            await prisma_1.prisma.plantTask.update({
                                where: { id: task.id },
                                data: { googleCalendarEventId: eventId },
                            });
                        }
                    }
                    else {
                        if (task.googleCalendarEventId) {
                            await googleCalendarService_1.googleCalendarService.deleteTaskEvent(userId, task.googleCalendarEventId);
                        }
                        await prisma_1.prisma.plantTask.update({
                            where: { id: task.id },
                            data: { googleCalendarEventId: null },
                        });
                    }
                    successCount++;
                }
                catch (error) {
                    console.error(`Error ${removeUnsynced ? 'removing' : 'syncing'} task ${task.id}:`, error);
                    failureCount++;
                }
            }
            console.log(`${removeUnsynced ? 'Removed' : 'Synced'} ${successCount} tasks for user ${userId}, ${failureCount} failed`);
            return { successCount, failureCount };
        }
        catch (error) {
            console.error(`Error processing tasks for plants [${plantIds.join(', ')}] for user ${userId}:`, error);
            return { successCount, failureCount };
        }
    }
    async syncAllUserTasks(userId) {
        try {
            const userSettings = await prisma_1.prisma.userSettings.findUnique({
                where: { userId },
                select: {
                    googleCalendarSyncEnabled: true,
                    googleCalendarReminderMinutes: true,
                    syncedPlantIds: true,
                    googleCalendarAccessToken: true,
                },
            });
            if (!userSettings?.googleCalendarSyncEnabled ||
                !userSettings.googleCalendarAccessToken ||
                !userSettings.syncedPlantIds ||
                userSettings.syncedPlantIds.length === 0) {
                return { successCount: 0, failureCount: 0 };
            }
            return this.syncTasksForPlants(userId, userSettings.syncedPlantIds, userSettings.googleCalendarReminderMinutes);
        }
        catch (error) {
            console.error(`Error syncing all tasks for user ${userId}:`, error);
            return { successCount: 0, failureCount: 0 };
        }
    }
    async removeAllUserTasks(userId) {
        try {
            const userSettings = await prisma_1.prisma.userSettings.findUnique({
                where: { userId },
                select: { syncedPlantIds: true },
            });
            const plantIds = userSettings?.syncedPlantIds || [];
            if (plantIds.length === 0) {
                return;
            }
            await this.syncTasksForPlants(userId, plantIds, undefined, true);
        }
        catch (error) {
            console.error(`Error removing all tasks for user ${userId}:`, error);
        }
    }
}
exports.TaskSyncService = TaskSyncService;
exports.taskSyncService = new TaskSyncService();
//# sourceMappingURL=taskSyncService.js.map