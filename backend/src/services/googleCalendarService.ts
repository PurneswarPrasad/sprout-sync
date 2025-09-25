import { google } from 'googleapis';
import { prisma } from '../lib/prisma';

export class GoogleCalendarService {
  private oauth2Client: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env['GOOGLE_CLIENT_ID'],
      process.env['GOOGLE_CLIENT_SECRET'],
      `${process.env['API_BASE_URL'] || 'http://localhost:3001'}/api/google-calendar/callback`
    );
  }

  /**
   * Get authorization URL for Google Calendar access
   */
  getAuthUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId, // Pass userId in state to identify user after callback
      prompt: 'consent' // Force consent screen to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string, userId: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiryDate: Date;
  }> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Failed to get access or refresh token');
      }

      // Update user settings with tokens
      await prisma.userSettings.upsert({
        where: { userId },
        update: {
          googleCalendarAccessToken: tokens.access_token,
          googleCalendarRefreshToken: tokens.refresh_token,
          googleCalendarTokenExpiry: new Date(tokens.expiry_date || Date.now() + 3600000),
        },
        create: {
          userId,
          persona: 'PRIMARY', // Default persona
          timezone: 'UTC', // Default timezone
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
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Get authenticated calendar client for user
   */
  private async getCalendarClient(userId: string) {
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId }
    });

    if (!userSettings?.googleCalendarAccessToken || !userSettings?.googleCalendarRefreshToken) {
      throw new Error('User has not authorized Google Calendar access');
    }

    // Set credentials
    this.oauth2Client.setCredentials({
      access_token: userSettings.googleCalendarAccessToken,
      refresh_token: userSettings.googleCalendarRefreshToken,
      expiry_date: userSettings.googleCalendarTokenExpiry?.getTime()
    });

    // Refresh token if needed
    if (userSettings.googleCalendarTokenExpiry && userSettings.googleCalendarTokenExpiry <= new Date()) {
      try {
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        
        // Update tokens in database
        await prisma.userSettings.update({
          where: { userId },
          data: {
            googleCalendarAccessToken: credentials.access_token,
            googleCalendarTokenExpiry: new Date(credentials.expiry_date || Date.now() + 3600000),
          }
        });

        this.oauth2Client.setCredentials(credentials);
      } catch (error) {
        console.error('Error refreshing token:', error);
        throw new Error('Failed to refresh access token');
      }
    }

    return google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Create calendar event for a plant task
   */
  async createTaskEvent(userId: string, task: any, reminderMinutes: number = 30): Promise<string> {
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
          dateTime: new Date(task.nextDueOn.getTime() + 30 * 60 * 1000).toISOString(), // 30 minutes duration
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
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  /**
   * Update calendar event for a plant task
   */
  async updateTaskEvent(userId: string, eventId: string, task: any, reminderMinutes: number = 30): Promise<void> {
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
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw new Error('Failed to update calendar event');
    }
  }

  /**
   * Delete calendar event
   */
  async deleteTaskEvent(userId: string, eventId: string): Promise<void> {
    try {
      const calendar = await this.getCalendarClient(userId);
      
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      // Don't throw error for deletion - event might not exist
    }
  }

  /**
   * Get human-readable task label
   */
  private getTaskLabel(taskKey: string): string {
    const taskLabels: { [key: string]: string } = {
      'watering': 'Water Plant',
      'fertilizing': 'Fertilize Plant',
      'spraying': 'Spray Plant',
      'pruning': 'Prune Plant',
      'sunlightRotation': 'Rotate Plant for Sun'
    };
    
    return taskLabels[taskKey] || taskKey;
  }

  /**
   * Check if user has valid Google Calendar access
   */
  async hasValidAccess(userId: string): Promise<boolean> {
    try {
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId }
      });

      if (!userSettings?.googleCalendarAccessToken || !userSettings?.googleCalendarRefreshToken) {
        return false;
      }

      // Try to get calendar client to verify access
      await this.getCalendarClient(userId);
      return true;
    } catch (error) {
      console.error('Error checking Google Calendar access:', error);
      return false;
    }
  }

  /**
   * Revoke Google Calendar access
   */
  async revokeAccess(userId: string): Promise<void> {
    try {
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId }
      });

      if (userSettings?.googleCalendarAccessToken) {
        this.oauth2Client.setCredentials({
          access_token: userSettings.googleCalendarAccessToken,
          refresh_token: userSettings.googleCalendarRefreshToken,
        });

        await this.oauth2Client.revokeCredentials();
      }

      // Clear tokens from database
      await prisma.userSettings.update({
        where: { userId },
        data: {
          googleCalendarSyncEnabled: false,
          googleCalendarAccessToken: null,
          googleCalendarRefreshToken: null,
          googleCalendarTokenExpiry: null,
          syncedPlantIds: [],
        }
      });
    } catch (error) {
      console.error('Error revoking Google Calendar access:', error);
      // Still clear from database even if revocation fails
      await prisma.userSettings.update({
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

export const googleCalendarService = new GoogleCalendarService();
