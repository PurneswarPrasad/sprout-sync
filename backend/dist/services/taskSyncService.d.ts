export declare class TaskSyncService {
    syncTaskToCalendar(taskId: string): Promise<void>;
    updateTaskInCalendar(taskId: string, eventId?: string): Promise<void>;
    removeTaskFromCalendar(taskId: string, eventId?: string): Promise<void>;
    syncTasksForPlants(userId: string, plantIds: string[], reminderMinutes?: number, removeUnsynced?: boolean): Promise<{
        successCount: number;
        failureCount: number;
    }>;
    syncAllUserTasks(userId: string): Promise<{
        successCount: number;
        failureCount: number;
    }>;
    removeAllUserTasks(userId: string): Promise<void>;
}
export declare const taskSyncService: TaskSyncService;
//# sourceMappingURL=taskSyncService.d.ts.map