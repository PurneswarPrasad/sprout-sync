import * as admin from 'firebase-admin';
import { Persona } from '@prisma/client';
export declare const initializeFirebase: () => admin.app.App;
export interface OverdueTask {
    id: string;
    plantId: string;
    plantName: string;
    taskKey: string;
    nextDueOn: Date;
    userId: string;
    userPersona: Persona;
    fcmToken: string;
}
export interface NotificationResult {
    success: boolean;
    messageId?: string;
    error?: string;
    fcmToken?: string;
}
export declare class FirebaseNotificationService {
    private messaging;
    constructor();
    sendNotification(fcmToken: string, title: string, body: string, data?: Record<string, string>): Promise<NotificationResult>;
    sendCareReminderNotification(overdueTask: OverdueTask, messageVariation?: number): Promise<NotificationResult>;
    sendMultipleCareReminders(overdueTasks: OverdueTask[], startIndex?: number): Promise<NotificationResult[]>;
    private removeInvalidToken;
    private logNotification;
    updateUserFCMToken(userId: string, fcmToken: string): Promise<void>;
    getUsersWithFCMTokens(): Promise<Array<{
        userId: string;
        fcmToken: string;
        persona: Persona;
    }>>;
}
export declare const firebaseNotificationService: FirebaseNotificationService;
//# sourceMappingURL=firebaseNotificationService.d.ts.map