export declare class NotificationScheduler {
    private cronJob;
    private isRunning;
    private notificationIndex;
    start(): void;
    stop(): void;
    isSchedulerRunning(): boolean;
    private processOverdueTasks;
    private sendNotificationsToUsers;
    triggerNotificationProcess(): Promise<void>;
    getNotificationIndex(): number;
    resetNotificationIndex(): void;
    getStatus(): {
        isRunning: boolean;
        isProcessing: boolean;
        notificationIndex: number;
        nextRun?: Date;
    };
    private delay;
}
export declare const notificationScheduler: NotificationScheduler;
//# sourceMappingURL=notificationScheduler.d.ts.map