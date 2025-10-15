export declare class CronService {
    private static instance;
    private jobs;
    private constructor();
    static getInstance(): CronService;
    startDueTasksCheck(): void;
    stopDueTasksCheck(): void;
    stopAll(): void;
}
export declare const cronService: CronService;
//# sourceMappingURL=cronService.d.ts.map