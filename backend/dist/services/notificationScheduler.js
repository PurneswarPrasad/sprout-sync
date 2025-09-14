"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationScheduler = exports.NotificationScheduler = void 0;
const cron_1 = require("cron");
const firebaseNotificationService_1 = require("./firebaseNotificationService");
const overdueTaskService_1 = require("./overdueTaskService");
class NotificationScheduler {
    constructor() {
        this.cronJob = null;
        this.isRunning = false;
        this.notificationIndex = 0;
    }
    start() {
        if (this.cronJob) {
            console.log('Notification scheduler is already running');
            return;
        }
        this.cronJob = new cron_1.CronJob('0 */1 * * * *', async () => {
            await this.processOverdueTasks();
        }, null, true, 'UTC');
        console.log('Notification scheduler started - checking for overdue tasks every 3 minutes');
    }
    stop() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.cronJob = null;
            this.isRunning = false;
            console.log('Notification scheduler stopped');
        }
    }
    isSchedulerRunning() {
        return this.cronJob !== null && this.cronJob.running;
    }
    async processOverdueTasks() {
        if (this.isRunning) {
            console.log('Previous notification process still running, skipping this cycle');
            return;
        }
        this.isRunning = true;
        const startTime = Date.now();
        try {
            console.log('Starting overdue task notification process...');
            const tasksByUser = await overdueTaskService_1.overdueTaskService.getOverdueTasksGroupedByUser();
            if (tasksByUser.size === 0) {
                console.log('No overdue tasks found');
                return;
            }
            console.log(`Found overdue tasks for ${tasksByUser.size} users`);
            const stats = await overdueTaskService_1.overdueTaskService.getOverdueTaskStats();
            console.log('Overdue task stats:', stats);
            const results = await this.sendNotificationsToUsers(tasksByUser);
            const successful = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;
            console.log(`Notification process completed: ${successful} successful, ${failed} failed`);
            this.notificationIndex++;
        }
        catch (error) {
            console.error('Error in notification process:', error);
        }
        finally {
            this.isRunning = false;
            const duration = Date.now() - startTime;
            console.log(`Notification process took ${duration}ms`);
        }
    }
    async sendNotificationsToUsers(tasksByUser) {
        const results = [];
        for (const [userId, userTasks] of tasksByUser) {
            try {
                const taskIndex = this.notificationIndex % userTasks.length;
                const taskToNotify = userTasks[taskIndex];
                console.log(`Sending notification to user ${userId} for task: ${taskToNotify.taskKey} (${taskToNotify.plantName})`);
                const result = await firebaseNotificationService_1.firebaseNotificationService.sendCareReminderNotification(taskToNotify, this.notificationIndex);
                results.push({
                    success: result.success,
                    ...(result.error && { error: result.error })
                });
                if (result.success) {
                    console.log(`✅ Notification sent successfully to user ${userId}`);
                }
                else {
                    console.log(`❌ Failed to send notification to user ${userId}: ${result.error}`);
                }
                await this.delay(100);
            }
            catch (error) {
                console.error(`Error sending notification to user ${userId}:`, error);
                results.push({
                    success: false,
                    error: error.message
                });
            }
        }
        return results;
    }
    async triggerNotificationProcess() {
        console.log('Manually triggering notification process...');
        await this.processOverdueTasks();
    }
    getNotificationIndex() {
        return this.notificationIndex;
    }
    resetNotificationIndex() {
        this.notificationIndex = 0;
        console.log('Notification index reset to 0');
    }
    getStatus() {
        const nextRun = this.cronJob?.nextDate()?.toJSDate();
        return {
            isRunning: this.isSchedulerRunning(),
            isProcessing: this.isRunning,
            notificationIndex: this.notificationIndex,
            ...(nextRun && { nextRun })
        };
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.NotificationScheduler = NotificationScheduler;
exports.notificationScheduler = new NotificationScheduler();
exports.notificationScheduler.start();
//# sourceMappingURL=notificationScheduler.js.map