import { OverdueTask } from './firebaseNotificationService';
export declare class OverdueTaskService {
    findOverdueTasks(): Promise<OverdueTask[]>;
    findOverdueTasksForUser(userId: string): Promise<OverdueTask[]>;
    getOverdueTaskStats(): Promise<{
        totalOverdueTasks: number;
        usersWithOverdueTasks: number;
        tasksByType: Record<string, number>;
    }>;
    getOverdueTasksGroupedByUser(): Promise<Map<string, OverdueTask[]>>;
    isTaskOverdue(taskId: string): Promise<boolean>;
    calculateNextDueDate(frequencyDays: number, lastCompletedOn?: Date): Date;
    markTaskCompleted(taskId: string): Promise<void>;
}
export declare const overdueTaskService: OverdueTaskService;
//# sourceMappingURL=overdueTaskService.d.ts.map