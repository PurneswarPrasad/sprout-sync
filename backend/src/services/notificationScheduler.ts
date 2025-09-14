import { CronJob } from 'cron';
import { firebaseNotificationService } from './firebaseNotificationService';
import { overdueTaskService } from './overdueTaskService';

export class NotificationScheduler {
  private cronJob: CronJob | null = null;
  private isRunning = false;
  private notificationIndex = 0; // For cycling through multiple overdue tasks

  /**
   * Start the notification scheduler
   * Runs every 3 minutes to check for overdue tasks and send notifications
   */
  start(): void {
    if (this.cronJob) {
      console.log('Notification scheduler is already running');
      return;
    }

    // Cron expression for every 3 minutes: '0 */3 * * * *'
    this.cronJob = new CronJob(
      '0 */1 * * * *', // Every 3 minutes
      async () => {
        await this.processOverdueTasks();
      },
      null,
      true, // Start immediately
      'UTC' // Timezone
    );

    console.log('Notification scheduler started - checking for overdue tasks every 3 minutes');
  }

  /**
   * Stop the notification scheduler
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      this.isRunning = false;
      console.log('Notification scheduler stopped');
    }
  }

  /**
   * Check if the scheduler is running
   */
  isSchedulerRunning(): boolean {
    return this.cronJob !== null && this.cronJob.running;
  }

  /**
   * Process overdue tasks and send notifications
   */
  private async processOverdueTasks(): Promise<void> {
    if (this.isRunning) {
      console.log('Previous notification process still running, skipping this cycle');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('Starting overdue task notification process...');

      // Get overdue tasks grouped by user
      const tasksByUser = await overdueTaskService.getOverdueTasksGroupedByUser();
      
      if (tasksByUser.size === 0) {
        console.log('No overdue tasks found');
        return;
      }

      console.log(`Found overdue tasks for ${tasksByUser.size} users`);

      // Get stats for logging
      const stats = await overdueTaskService.getOverdueTaskStats();
      console.log('Overdue task stats:', stats);

      // Process notifications for each user
      const results = await this.sendNotificationsToUsers(tasksByUser);
      
      // Log results
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      console.log(`Notification process completed: ${successful} successful, ${failed} failed`);

      // Increment notification index for cycling through multiple tasks
      this.notificationIndex++;

    } catch (error) {
      console.error('Error in notification process:', error);
    } finally {
      this.isRunning = false;
      const duration = Date.now() - startTime;
      console.log(`Notification process took ${duration}ms`);
    }
  }

  /**
   * Send notifications to users with overdue tasks
   */
  private async sendNotificationsToUsers(
    tasksByUser: Map<string, any[]>
  ): Promise<Array<{ success: boolean; error?: string }>> {
    const results: Array<{ success: boolean; error?: string }> = [];

    for (const [userId, userTasks] of tasksByUser) {
      try {
        // For users with multiple overdue tasks, cycle through them
        const taskIndex = this.notificationIndex % userTasks.length;
        const taskToNotify = userTasks[taskIndex];

        console.log(`Sending notification to user ${userId} for task: ${taskToNotify.taskKey} (${taskToNotify.plantName})`);

        const result = await firebaseNotificationService.sendCareReminderNotification(
          taskToNotify,
          this.notificationIndex
        );

        results.push({
          success: result.success,
          ...(result.error && { error: result.error })
        });

        if (result.success) {
          console.log(`✅ Notification sent successfully to user ${userId}`);
        } else {
          console.log(`❌ Failed to send notification to user ${userId}: ${result.error}`);
        }

        // Add a small delay between notifications to avoid rate limiting
        await this.delay(100);

      } catch (error: any) {
        console.error(`Error sending notification to user ${userId}:`, error);
        results.push({
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Manually trigger notification process (for testing)
   */
  async triggerNotificationProcess(): Promise<void> {
    console.log('Manually triggering notification process...');
    await this.processOverdueTasks();
  }

  /**
   * Get current notification index (for cycling through tasks)
   */
  getNotificationIndex(): number {
    return this.notificationIndex;
  }

  /**
   * Reset notification index
   */
  resetNotificationIndex(): void {
    this.notificationIndex = 0;
    console.log('Notification index reset to 0');
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isRunning: boolean;
    isProcessing: boolean;
    notificationIndex: number;
    nextRun?: Date;
  } {
    const nextRun = this.cronJob?.nextDate()?.toJSDate();
    
    return {
      isRunning: this.isSchedulerRunning(),
      isProcessing: this.isRunning,
      notificationIndex: this.notificationIndex,
      ...(nextRun && { nextRun })
    };
  }

  /**
   * Utility function to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const notificationScheduler = new NotificationScheduler();

// Auto-start the scheduler when this module is imported
// This will start the cron job when the server starts
notificationScheduler.start();

