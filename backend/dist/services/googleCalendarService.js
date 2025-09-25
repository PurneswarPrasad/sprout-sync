"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleCalendarService = exports.GoogleCalendarService = void 0;
const googleapis_1 = require("googleapis");
const prisma_1 = require("../lib/prisma");
class GoogleCalendarService {
    constructor() {
        this.oauth2Client = new googleapis_1.google.auth.OAuth2(process.env['GOOGLE_CLIENT_ID'], process.env['GOOGLE_CLIENT_SECRET'], `${process.env['API_BASE_URL'] || 'http://localhost:3001'}/api/google-calendar/callback`);
    }
    getAuthUrl(userId) {
        const scopes = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
        ];
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            state: userId,
            prompt: 'consent'
        });
    }
    async exchangeCodeForTokens(code, userId) {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            if (!tokens.access_token || !tokens.refresh_token) {
                throw new Error('Failed to get access or refresh token');
            }
            await prisma_1.prisma.userSettings.upsert({
                where: { userId },
                update: {
                    googleCalendarAccessToken: tokens.access_token,
                    googleCalendarRefreshToken: tokens.refresh_token,
                    googleCalendarTokenExpiry: new Date(tokens.expiry_date || Date.now() + 3600000),
                },
                create: {
                    userId,
                    persona: 'PRIMARY',
                    timezone: 'UTC',
                    googleCalendarAccessToken: tokens.access_token,
                    googleCalendarRefreshToken: tokens.refresh_token,
                    googleCalendarTokenExpiry: new Date(tokens.expiry_date || Date.now() + 3600000),
                }
            });
            return {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiryDate: new Date(tokens.expiry_date || Date.now() + 3600000)
            };
        }
        catch (error) {
            console.error('Error exchanging code for tokens:', error);
            throw new Error('Failed to exchange authorization code for tokens');
        }
    }
    async getCalendarClient(userId) {
        const userSettings = await prisma_1.prisma.userSettings.findUnique({
            where: { userId }
        });
        if (!userSettings?.googleCalendarAccessToken || !userSettings?.googleCalendarRefreshToken) {
            throw new Error('User has not authorized Google Calendar access');
        }
        this.oauth2Client.setCredentials({
            access_token: userSettings.googleCalendarAccessToken,
            refresh_token: userSettings.googleCalendarRefreshToken,
            expiry_date: userSettings.googleCalendarTokenExpiry?.getTime()
        });
        if (userSettings.googleCalendarTokenExpiry && userSettings.googleCalendarTokenExpiry <= new Date()) {
            try {
                const { credentials } = await this.oauth2Client.refreshAccessToken();
                await prisma_1.prisma.userSettings.update({
                    where: { userId },
                    data: {
                        googleCalendarAccessToken: credentials.access_token,
                        googleCalendarTokenExpiry: new Date(credentials.expiry_date || Date.now() + 3600000),
                    }
                });
                this.oauth2Client.setCredentials(credentials);
            }
            catch (error) {
                console.error('Error refreshing token:', error);
                throw new Error('Failed to refresh access token');
            }
        }
        return googleapis_1.google.calendar({ version: 'v3', auth: this.oauth2Client });
    }
    async createTaskEvent(userId, task, reminderMinutes = 30) {
        try {
            const calendar = await this.getCalendarClient(userId);
            const plantName = task.plant.petName || task.plant.commonName.split(',')[0].trim() || task.plant.botanicalName || 'Unknown Plant';
            const taskLabel = this.getTaskLabel(task.taskKey);
            const event = {
                summary: `${taskLabel} - ${plantName}`,
                description: `Plant care reminder: ${taskLabel} for ${plantName}`,
                start: {
                    dateTime: task.nextDueOn.toISOString(),
                    timeZone: 'UTC',
                },
                end: {
                    dateTime: new Date(task.nextDueOn.getTime() + 30 * 60 * 1000).toISOString(),
                    timeZone: 'UTC',
                },
                reminders: {
                    useDefault: false,
                    overrides: [
                        {
                            method: 'popup',
                            minutes: reminderMinutes,
                        },
                        {
                            method: 'email',
                            minutes: reminderMinutes,
                        },
                    ],
                },
                source: {
                    title: 'PlantCare App',
                    url: process.env['FRONTEND_URL'] || 'https://localhost:5173'
                }
            };
            const response = await calendar.events.insert({
                calendarId: 'primary',
                requestBody: event,
            });
            return response.data.id || '';
        }
        catch (error) {
            console.error('Error creating calendar event:', error);
            throw new Error('Failed to create calendar event');
        }
    }
    async updateTaskEvent(userId, eventId, task, reminderMinutes = 30) {
        try {
            const calendar = await this.getCalendarClient(userId);
            const plantName = task.plant.petName || task.plant.commonName || task.plant.botanicalName || 'Unknown Plant';
            const taskLabel = this.getTaskLabel(task.taskKey);
            const event = {
                summary: `${taskLabel} - ${plantName}`,
                description: `Plant care reminder: ${taskLabel} for ${plantName}`,
                start: {
                    dateTime: task.nextDueOn.toISOString(),
                    timeZone: 'UTC',
                },
                end: {
                    dateTime: new Date(task.nextDueOn.getTime() + 30 * 60 * 1000).toISOString(),
                    timeZone: 'UTC',
                },
                reminders: {
                    useDefault: false,
                    overrides: [
                        {
                            method: 'popup',
                            minutes: reminderMinutes,
                        },
                        {
                            method: 'email',
                            minutes: reminderMinutes,
                        },
                    ],
                },
            };
            await calendar.events.update({
                calendarId: 'primary',
                eventId: eventId,
                requestBody: event,
            });
        }
        catch (error) {
            console.error('Error updating calendar event:', error);
            throw new Error('Failed to update calendar event');
        }
    }
    async deleteTaskEvent(userId, eventId) {
        try {
            const calendar = await this.getCalendarClient(userId);
            await calendar.events.delete({
                calendarId: 'primary',
                eventId: eventId,
            });
        }
        catch (error) {
            console.error('Error deleting calendar event:', error);
        }
    }
    getTaskLabel(taskKey) {
        const taskLabels = {
            'watering': 'Water Plant',
            'fertilizing': 'Fertilize Plant',
            'spraying': 'Spray Plant',
            'pruning': 'Prune Plant',
            'sunlightRotation': 'Rotate Plant for Sun'
        };
        return taskLabels[taskKey] || taskKey;
    }
    async hasValidAccess(userId) {
        try {
            const userSettings = await prisma_1.prisma.userSettings.findUnique({
                where: { userId }
            });
            if (!userSettings?.googleCalendarAccessToken || !userSettings?.googleCalendarRefreshToken) {
                return false;
            }
            await this.getCalendarClient(userId);
            return true;
        }
        catch (error) {
            console.error('Error checking Google Calendar access:', error);
            return false;
        }
    }
    async revokeAccess(userId) {
        try {
            const userSettings = await prisma_1.prisma.userSettings.findUnique({
                where: { userId }
            });
            if (userSettings?.googleCalendarAccessToken) {
                this.oauth2Client.setCredentials({
                    access_token: userSettings.googleCalendarAccessToken,
                    refresh_token: userSettings.googleCalendarRefreshToken,
                });
                await this.oauth2Client.revokeCredentials();
            }
            await prisma_1.prisma.userSettings.update({
                where: { userId },
                data: {
                    googleCalendarSyncEnabled: false,
                    googleCalendarAccessToken: null,
                    googleCalendarRefreshToken: null,
                    googleCalendarTokenExpiry: null,
                    syncedPlantIds: [],
                }
            });
        }
        catch (error) {
            console.error('Error revoking Google Calendar access:', error);
            await prisma_1.prisma.userSettings.update({
                where: { userId },
                data: {
                    googleCalendarSyncEnabled: false,
                    googleCalendarAccessToken: null,
                    googleCalendarRefreshToken: null,
                    googleCalendarTokenExpiry: null,
                    syncedPlantIds: [],
                }
            });
        }
    }
}
exports.GoogleCalendarService = GoogleCalendarService;
exports.googleCalendarService = new GoogleCalendarService();
//# sourceMappingURL=googleCalendarService.js.map