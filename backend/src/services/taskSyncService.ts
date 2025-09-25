import { prisma } from '../lib/prisma';
import { googleCalendarService } from './googleCalendarService';

export class TaskSyncService {
  /**
   * Sync a task to Google Calendar if the owning plant is selected for sync
   */
  async syncTaskToCalendar(taskId: string): Promise<void> {
    try {
      const task = await prisma.plantTask.findUnique({
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

      const userSettings = await prisma.userSettings.findUnique({
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

      const hasValidAccess = await googleCalendarService.hasValidAccess(task.plant.userId);
      if (!hasValidAccess) {
        console.warn(`User ${task.plant.userId} has invalid Google Calendar access`);
        return;
      }

      const eventId = await googleCalendarService.createTaskEvent(
        task.plant.userId,
        task,
        userSettings.googleCalendarReminderMinutes
      );

      await prisma.plantTask.update({
        where: { id: taskId },
        data: { googleCalendarEventId: eventId },
      });

      console.log(`Successfully synced task ${taskId} to Google Calendar`);
    } catch (error) {
      console.error(`Error syncing task ${taskId} to Google Calendar:`, error);
    }
  }

  /**
   * Update an existing Google Calendar event or create one if missing
   */
  async updateTaskInCalendar(taskId: string, eventId?: string): Promise<void> {
    try {
      const task = await prisma.plantTask.findUnique({
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

      const userSettings = await prisma.userSettings.findUnique({
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

      const hasValidAccess = await googleCalendarService.hasValidAccess(task.plant.userId);
      if (!hasValidAccess) {
        console.warn(`User ${task.plant.userId} has invalid Google Calendar access`);
        return;
      }

      const reminder = userSettings.googleCalendarReminderMinutes;
      const storedEventId = eventId || task.googleCalendarEventId;

      if (storedEventId) {
        try {
          await googleCalendarService.updateTaskEvent(
            task.plant.userId,
            storedEventId,
            task,
            reminder
          );

          await prisma.plantTask.update({
            where: { id: taskId },
            data: { googleCalendarEventId: storedEventId },
          });
        } catch (updateError) {
          console.warn(`Error updating event ${storedEventId} for task ${taskId}, recreating`, updateError);
          const newEventId = await googleCalendarService.createTaskEvent(
            task.plant.userId,
            task,
            reminder
          );
          await prisma.plantTask.update({
            where: { id: taskId },
            data: { googleCalendarEventId: newEventId },
          });
        }
      } else {
        const newEventId = await googleCalendarService.createTaskEvent(
          task.plant.userId,
          task,
          reminder
        );
        await prisma.plantTask.update({
          where: { id: taskId },
          data: { googleCalendarEventId: newEventId },
        });
      }

      console.log(`Successfully updated task ${taskId} in Google Calendar`);
    } catch (error) {
      console.error(`Error updating task ${taskId} in Google Calendar:`, error);
    }
  }

  /**
   * Remove a task from Google Calendar and clear stored event ID
   */
  async removeTaskFromCalendar(taskId: string, eventId?: string): Promise<void> {
    try {
      const task = await prisma.plantTask.findUnique({
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

      const userSettings = await prisma.userSettings.findUnique({
        where: { userId: task.plant.userId },
        select: {
          googleCalendarAccessToken: true,
        },
      });

      if (!userSettings?.googleCalendarAccessToken) {
        return;
      }

      const hasValidAccess = await googleCalendarService.hasValidAccess(task.plant.userId);
      if (!hasValidAccess) {
        console.warn(`User ${task.plant.userId} has invalid Google Calendar access`);
        return;
      }

      const targetEventId = eventId || task.googleCalendarEventId;

      if (targetEventId) {
        await googleCalendarService.deleteTaskEvent(task.plant.userId, targetEventId);
      }

      await prisma.plantTask.update({
        where: { id: taskId },
        data: { googleCalendarEventId: null },
      });

      console.log(`Successfully removed task ${taskId} from Google Calendar`);
    } catch (error) {
      console.error(`Error removing task ${taskId} from Google Calendar:`, error);
    }
  }

  /**
   * Sync tasks for a specific set of plants. When removeUnsynced is true, delete events instead.
   */
  async syncTasksForPlants(
    userId: string,
    plantIds: string[],
    reminderMinutes?: number,
    removeUnsynced = false
  ): Promise<{ successCount: number; failureCount: number }> {
    let successCount = 0;
    let failureCount = 0;

    try {
      if (!plantIds || plantIds.length === 0) {
        return { successCount, failureCount };
      }

      const userSettings = await prisma.userSettings.findUnique({
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

      const hasValidAccess = await googleCalendarService.hasValidAccess(userId);
      if (!hasValidAccess) {
        console.warn(`User ${userId} has invalid Google Calendar access`);
        return { successCount, failureCount };
      }

      const reminder = reminderMinutes ?? userSettings.googleCalendarReminderMinutes;

      const tasks = await prisma.plantTask.findMany({
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
              await googleCalendarService.updateTaskEvent(
                userId,
                task.googleCalendarEventId,
                task,
                reminder
              );
            } else {
              const eventId = await googleCalendarService.createTaskEvent(
                userId,
                task,
                reminder
              );
              await prisma.plantTask.update({
                where: { id: task.id },
                data: { googleCalendarEventId: eventId },
              });
            }
          } else {
            if (task.googleCalendarEventId) {
              await googleCalendarService.deleteTaskEvent(
                userId,
                task.googleCalendarEventId
              );
            }

            await prisma.plantTask.update({
              where: { id: task.id },
              data: { googleCalendarEventId: null },
            });
          }

          successCount++;
        } catch (error) {
          console.error(`Error ${removeUnsynced ? 'removing' : 'syncing'} task ${task.id}:`, error);
          failureCount++;
        }
      }

      console.log(
        `${removeUnsynced ? 'Removed' : 'Synced'} ${successCount} tasks for user ${userId}, ${failureCount} failed`
      );

      return { successCount, failureCount };
    } catch (error) {
      console.error(
        `Error processing tasks for plants [${plantIds.join(', ')}] for user ${userId}:`,
        error
      );
      return { successCount, failureCount };
    }
  }

  /**
   * Sync all tasks for the plants currently selected by the user
   */
  async syncAllUserTasks(userId: string): Promise<{ successCount: number; failureCount: number }> {
    try {
      const userSettings = await prisma.userSettings.findUnique({
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

      return this.syncTasksForPlants(
        userId,
        userSettings.syncedPlantIds,
        userSettings.googleCalendarReminderMinutes
      );
    } catch (error) {
      console.error(`Error syncing all tasks for user ${userId}:`, error);
      return { successCount: 0, failureCount: 0 };
    }
  }

  /**
   * Remove all synced tasks for a user (best-effort)
   */
  async removeAllUserTasks(userId: string): Promise<void> {
    try {
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId },
        select: { syncedPlantIds: true },
      });

      const plantIds = userSettings?.syncedPlantIds || [];

      if (plantIds.length === 0) {
        return;
      }

      await this.syncTasksForPlants(userId, plantIds, undefined, true);
    } catch (error) {
      console.error(`Error removing all tasks for user ${userId}:`, error);
    }
  }
}

export const taskSyncService = new TaskSyncService();