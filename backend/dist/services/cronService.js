"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cronService = exports.CronService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const notificationService_1 = require("./notificationService");
class CronService {
    constructor() {
        this.jobs = new Map();
    }
    static getInstance() {
        if (!CronService.instance) {
            CronService.instance = new CronService();
        }
        return CronService.instance;
    }
    startDueTasksCheck() {
        this.stopDueTasksCheck();
        const job = node_cron_1.default.schedule('* * * * *', async () => {
            console.log('⏰ Running scheduled task notification check...');
            try {
                await notificationService_1.notificationService.checkAndSendDueTaskNotifications();
            }
            catch (error) {
                console.error('Error in scheduled task check:', error);
            }
        });
        this.jobs.set('dueTasks', job);
        console.log('✅ Due tasks notification cron job started (runs every minute)');
    }
    stopDueTasksCheck() {
        const job = this.jobs.get('dueTasks');
        if (job) {
            job.stop();
            this.jobs.delete('dueTasks');
            console.log('🛑 Due tasks notification cron job stopped');
        }
    }
    stopAll() {
        this.jobs.forEach((job, name) => {
            job.stop();
            console.log(`🛑 Stopped cron job: ${name}`);
        });
        this.jobs.clear();
    }
}
exports.CronService = CronService;
exports.cronService = CronService.getInstance();
//# sourceMappingURL=cronService.js.map