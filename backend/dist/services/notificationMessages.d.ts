import { Persona } from '@prisma/client';
export interface NotificationMessage {
    title: string;
    body: string;
}
export interface PlantTaskNotification {
    plantName: string;
    taskKey: string;
    persona: Persona;
}
export declare const getNotificationMessage: (plantName: string, taskKey: string, persona: Persona) => NotificationMessage;
export declare const getAlternativeNotificationMessage: (plantName: string, taskKey: string, persona: Persona, variation?: number) => NotificationMessage;
//# sourceMappingURL=notificationMessages.d.ts.map