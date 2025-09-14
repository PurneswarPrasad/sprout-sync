"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseNotificationService = exports.FirebaseNotificationService = exports.initializeFirebase = void 0;
const admin = __importStar(require("firebase-admin"));
const prisma_1 = require("../lib/prisma");
const notificationMessages_1 = require("./notificationMessages");
let firebaseApp = null;
const initializeFirebase = () => {
    if (firebaseApp) {
        return firebaseApp;
    }
    try {
        const serviceAccount = {
            type: "service_account",
            project_id: process.env['FIREBASE_PROJECT_ID'],
            private_key_id: process.env['FIREBASE_PRIVATE_KEY_ID'],
            private_key: process.env['FIREBASE_PRIVATE_KEY']?.replace(/\\n/g, '\n'),
            client_email: process.env['FIREBASE_CLIENT_EMAIL'],
            client_id: process.env['FIREBASE_CLIENT_ID'],
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env['FIREBASE_CLIENT_EMAIL']}`
        };
        const projectId = process.env['FIREBASE_PROJECT_ID'];
        if (!projectId) {
            throw new Error('FIREBASE_PROJECT_ID environment variable is required');
        }
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: projectId,
        });
        console.log('Firebase Admin SDK initialized successfully');
        return firebaseApp;
    }
    catch (error) {
        console.error('Error initializing Firebase Admin SDK:', error);
        throw error;
    }
};
exports.initializeFirebase = initializeFirebase;
class FirebaseNotificationService {
    constructor() {
        const app = (0, exports.initializeFirebase)();
        this.messaging = admin.messaging(app);
    }
    async sendNotification(fcmToken, title, body, data) {
        try {
            const message = {
                token: fcmToken,
                notification: {
                    title,
                    body,
                },
                data: data || {},
                webpush: {
                    notification: {
                        title,
                        body,
                        icon: '/pwa-192x192.png',
                        badge: '/pwa-192x192.png',
                        requireInteraction: true,
                    },
                    fcmOptions: {
                        link: process.env['FRONTEND_URL'] || 'http://localhost:3000'
                    }
                }
            };
            const response = await this.messaging.send(message);
            return {
                success: true,
                messageId: response
            };
        }
        catch (error) {
            console.error('Error sending notification:', error);
            if (error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered') {
                await this.removeInvalidToken(fcmToken);
            }
            return {
                success: false,
                error: error.message,
                fcmToken
            };
        }
    }
    async sendCareReminderNotification(overdueTask, messageVariation = 0) {
        const { plantName, taskKey, userPersona, fcmToken } = overdueTask;
        const message = messageVariation === 0
            ? (0, notificationMessages_1.getNotificationMessage)(plantName, taskKey, userPersona)
            : (0, notificationMessages_1.getAlternativeNotificationMessage)(plantName, taskKey, userPersona, messageVariation);
        const data = {
            plantId: overdueTask.plantId,
            taskId: overdueTask.id,
            taskKey: taskKey,
            type: 'care_reminder',
            userId: overdueTask.userId
        };
        const result = await this.sendNotification(fcmToken, message.title, message.body, data);
        if (result.success) {
            await this.logNotification(overdueTask.userId, {
                title: message.title,
                body: message.body,
                data,
                ...(result.messageId && { messageId: result.messageId })
            });
        }
        return result;
    }
    async sendMultipleCareReminders(overdueTasks, startIndex = 0) {
        const results = [];
        const tasksByUser = new Map();
        for (const task of overdueTasks) {
            if (!tasksByUser.has(task.userId)) {
                tasksByUser.set(task.userId, []);
            }
            tasksByUser.get(task.userId).push(task);
        }
        for (const [userId, userTasks] of tasksByUser) {
            const taskIndex = startIndex % userTasks.length;
            const taskToNotify = userTasks[taskIndex];
            if (!taskToNotify) {
                console.warn(`No task found at index ${taskIndex} for user ${userId}`);
                continue;
            }
            const result = await this.sendCareReminderNotification(taskToNotify, startIndex);
            results.push(result);
        }
        return results;
    }
    async removeInvalidToken(fcmToken) {
        try {
            await prisma_1.prisma.userSettings.updateMany({
                where: { fcmToken },
                data: { fcmToken: null }
            });
            console.log(`Removed invalid FCM token: ${fcmToken.substring(0, 20)}...`);
        }
        catch (error) {
            console.error('Error removing invalid FCM token:', error);
        }
    }
    async logNotification(userId, payload) {
        try {
            await prisma_1.prisma.notificationLog.create({
                data: {
                    userId,
                    payloadJson: JSON.stringify(payload),
                    channel: 'WEB_PUSH'
                }
            });
        }
        catch (error) {
            console.error('Error logging notification:', error);
        }
    }
    async updateUserFCMToken(userId, fcmToken) {
        try {
            await prisma_1.prisma.userSettings.upsert({
                where: { userId },
                update: { fcmToken },
                create: {
                    userId,
                    fcmToken,
                    persona: 'PRIMARY',
                    timezone: 'UTC'
                }
            });
            console.log(`Updated FCM token for user: ${userId}`);
        }
        catch (error) {
            console.error('Error updating FCM token:', error);
            throw error;
        }
    }
    async getUsersWithFCMTokens() {
        try {
            const users = await prisma_1.prisma.userSettings.findMany({
                where: {
                    fcmToken: { not: null }
                },
                select: {
                    userId: true,
                    fcmToken: true,
                    persona: true
                }
            });
            return users.filter(user => user.fcmToken !== null);
        }
        catch (error) {
            console.error('Error fetching users with FCM tokens:', error);
            return [];
        }
    }
}
exports.FirebaseNotificationService = FirebaseNotificationService;
exports.firebaseNotificationService = new FirebaseNotificationService();
//# sourceMappingURL=firebaseNotificationService.js.map