export interface NotificationPayload {
    title: string;
    body: string;
    plantId: string;
    plantName: string;
    taskId?: string;
    taskKey?: string;
}
export declare class NotificationService {
    sendNotification(userId: string, payload: NotificationPayload): Promise<boolean>;
    sendImmediateTaskNotifications(userId: string, plantId: string): Promise<void>;
    checkAndSendDueTaskNotifications(): Promise<void>;
    scheduleNextTaskNotification(taskId: string): Promise<void>;
    saveUserToken(userId: string, fcmToken: string): Promise<void>;
    updateNotificationSettings(userId: string, enabled: boolean): Promise<void>;
    markPromptShown(userId: string): Promise<void>;
}
export declare const notificationService: NotificationService;
//# sourceMappingURL=notificationService.d.ts.map