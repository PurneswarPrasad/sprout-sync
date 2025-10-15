import cron, { ScheduledTask } from 'node-cron';
import { notificationService } from './notificationService';

export class CronService {
  private static instance: CronService;
  private jobs: Map<string, ScheduledTask> = new Map();

  private constructor() {}

  static getInstance(): CronService {
    if (!CronService.instance) {
      CronService.instance = new CronService();
    }
    return CronService.instance;
  }

  /**
   * Start the cron job for checking due tasks
   * Runs every minute
   */
  startDueTasksCheck() {
    // Stop existing job if any
    this.stopDueTasksCheck();

    // Schedule to run every minute
    const job = cron.schedule('* * * * *', async () => {
      console.log('⏰ Running scheduled task notification check...');
      try {
        await notificationService.checkAndSendDueTaskNotifications();
      } catch (error) {
        console.error('Error in scheduled task check:', error);
      }
    });

    this.jobs.set('dueTasks', job);
    console.log('✅ Due tasks notification cron job started (runs every minute)');
  }

  /**
   * Stop the due tasks check cron job
   */
  stopDueTasksCheck() {
    const job = this.jobs.get('dueTasks');
    if (job) {
      job.stop();
      this.jobs.delete('dueTasks');
      console.log('🛑 Due tasks notification cron job stopped');
    }
  }

  /**
   * Stop all cron jobs
   */
  stopAll() {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`🛑 Stopped cron job: ${name}`);
    });
    this.jobs.clear();
  }
}

export const cronService = CronService.getInstance();

