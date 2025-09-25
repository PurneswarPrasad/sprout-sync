export declare class GoogleCalendarService {
    private oauth2Client;
    constructor();
    getAuthUrl(userId: string): string;
    exchangeCodeForTokens(code: string, userId: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiryDate: Date;
    }>;
    private getCalendarClient;
    createTaskEvent(userId: string, task: any, reminderMinutes?: number): Promise<string>;
    updateTaskEvent(userId: string, eventId: string, task: any, reminderMinutes?: number): Promise<void>;
    deleteTaskEvent(userId: string, eventId: string): Promise<void>;
    private getTaskLabel;
    hasValidAccess(userId: string): Promise<boolean>;
    revokeAccess(userId: string): Promise<void>;
}
export declare const googleCalendarService: GoogleCalendarService;
//# sourceMappingURL=googleCalendarService.d.ts.map