# Firebase Notification System Setup Guide

This guide explains how to set up and use the Firebase notification system for SproutSync.

## Overview

The notification system sends browser notifications to users for:
- **Immediate notifications** when a plant is added with tasks
- **Scheduled notifications** when tasks become due (checked every minute via cron job)
- **Next task notifications** after completing a task

## Features

✅ Foreground notifications (app is open) - shown as in-app toasts  
✅ Background notifications (app is closed) - shown as browser notifications  
✅ Notification prompt page for new users  
✅ Settings page with notification toggle  
✅ Auto-dismiss after 10 seconds  
✅ Click notification to navigate to plant detail page  
✅ Vertically stacked notifications  
✅ Clears localStorage on logout  

## Backend Setup

### 1. Environment Variables

Add these to your `.env` file in the `backend` directory:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
```

### 2. Getting Firebase Admin Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file and extract the values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key_id` → `FIREBASE_PRIVATE_KEY_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the \n characters)
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `client_id` → `FIREBASE_CLIENT_ID`

### 3. Database Migration

The database migration has already been applied. It adds:
- `fcmToken` field to store user's Firebase Cloud Messaging token
- `notificationsEnabled` boolean to track if user has notifications enabled
- `notificationPromptShown` boolean to track if user has seen the prompt

### 4. Cron Job

The cron job automatically starts when the backend server starts. It runs every minute to check for due tasks and send notifications.

## Frontend Setup

### 1. Environment Variables

Add these to your `.env` file in the `frontend` directory:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_VAPID_KEY=your-vapid-key
```

### 2. Getting Firebase Frontend Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** > **General**
4. Scroll down to **Your apps** section
5. If you don't have a web app, click **Add app** and select **Web**
6. Copy the config values:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`

### 3. Getting VAPID Key

1. In Firebase Console, go to **Project Settings** > **Cloud Messaging**
2. Scroll down to **Web Push certificates**
3. Click **Generate key pair**
4. Copy the key → `VITE_FIREBASE_VAPID_KEY`

### 4. Service Worker

The service worker is automatically generated from a template at build/dev time. The `scripts/generate-sw.js` script replaces placeholders with your environment variables.

## User Flow

### New User
1. User logs in for the first time
2. Redirected to `/notification-prompt` page
3. User can choose:
   - **Enable Notifications** → Requests browser permission and saves FCM token
   - **Not Now** → Skips for now, can enable later in settings
4. Redirected to `/home`

### Existing User
1. User logs in
2. If already seen prompt, goes directly to `/home`
3. Can manage notifications in **Settings** (accessible via profile dropdown)

### When Adding a Plant
1. User adds a plant with tasks (e.g., watering, pruning)
2. **Immediate notifications** sent for each task
3. User receives notifications (if enabled and permission granted)

### When Task is Due
1. Cron job runs every minute
2. Checks for tasks where `nextDueOn <= now`
3. Sends notifications to users with notifications enabled
4. Only sends ONE notification per task cycle (prevents repeated notifications for overdue tasks)
5. After task is completed, the next notification will be sent when it becomes due again

### When Completing a Task
1. User marks a task as complete
2. `nextDueOn` is updated to `completionTime + frequencyDays`
3. Next notification will be sent when the new `nextDueOn` is reached

### When Enabling/Disabling Notifications

#### Enabling Notifications (Toggle ON)
1. Records timestamp of when notifications were enabled (`notificationsEnabledAt`)
2. **Immediate notifications**: Only sent for plants added AFTER this moment
3. **Scheduled notifications**: Only sent for tasks that become due AFTER this moment
4. **No spam**: Old plants and already-overdue tasks don't trigger notifications

#### Disabling Notifications (Toggle OFF)
1. Stops ALL notifications immediately
2. Clears the `notificationsEnabledAt` timestamp
3. No immediate or scheduled notifications will be sent
4. Existing due tasks remain tracked but not notified

#### Example Scenario
- **Day 1, 10:00 AM**: Enable notifications → records timestamp
- **Day 1, 10:30 AM**: Add Plant A with watering task (due Day 3) → Get 1 immediate notification ✅
- **Day 1, 11:00 AM**: Disable notifications
- **Day 1, 11:30 AM**: Add Plant B with watering task (due Day 3) → No notifications ✅
- **Day 2, 09:00 AM**: Enable notifications again → records NEW timestamp
- **Day 2, 09:30 AM**: Add Plant C with watering task (due Day 4) → Get 1 immediate notification ✅
- **Day 3, 10:30 AM**: Plant A's watering task becomes due (after Day 2, 09:00 AM) → Get scheduled notification ✅
- **Day 3, 11:30 AM**: Plant B's watering task becomes due (before Day 2, 09:00 AM) → No notification ❌ (was already due)
- **Day 4, 09:30 AM**: Plant C's watering task becomes due (after Day 2, 09:00 AM) → Get scheduled notification ✅

**Key Point**: Only tasks that become due AFTER enabling notifications will send scheduled notifications. This prevents spam from already-overdue tasks.

## Notification Behavior

### Foreground (App is Open)
- Shows in-app toast notification at top-right
- Auto-dismisses after 10 seconds
- Can be manually dismissed by clicking X
- Click notification to navigate to plant detail page

### Background (App is Closed)
- Shows browser notification
- Auto-dismisses after 10 seconds
- Has action buttons: "View Plant" and "Dismiss"
- Click notification to open app and navigate to plant detail page

### Stacking
- Multiple notifications stack vertically
- Each notification is independent
- Can dismiss individually

## API Endpoints

### POST /api/notifications/token
Save/update user's FCM token
```json
{
  "fcmToken": "string"
}
```

### PUT /api/notifications/settings
Update notification settings
```json
{
  "enabled": boolean
}
```

### GET /api/notifications/settings
Get notification settings
```json
{
  "notificationsEnabled": boolean,
  "notificationPromptShown": boolean,
  "hasToken": boolean
}
```

### POST /api/notifications/prompt-shown
Mark notification prompt as shown

### POST /api/notifications/test
Send a test notification (development only)

## Testing

### Test Notification
```bash
# Make sure you're authenticated and have notifications enabled
curl -X POST http://localhost:3001/api/notifications/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Check Notification Settings
```bash
curl http://localhost:3001/api/notifications/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### Notifications Not Appearing

1. **Check browser permissions**
   - Go to browser settings → Site Settings → Notifications
   - Make sure notifications are allowed for your site

2. **Check FCM token**
   - Open browser console
   - Look for "FCM Token:" log
   - If no token, try toggling notifications in settings

3. **Check backend logs**
   - Look for "Notification sent successfully" or error messages
   - Check if cron job is running: "⏰ Running scheduled task notification check..."

4. **Check notification settings in DB**
   ```sql
   SELECT notificationsEnabled, fcmToken, notificationPromptShown 
   FROM "UserSettings" 
   WHERE userId = 'your-user-id';
   ```

### Service Worker Not Registering

1. **Check browser console** for service worker errors
2. **Make sure HTTPS** is enabled (or localhost for development)
3. **Clear browser cache** and reload
4. **Check service worker in DevTools** → Application → Service Workers

### Invalid FCM Token

1. Token may have expired
2. Toggle notifications off and on again in settings
3. This will request a new token

## Development vs Production

### Development
- Service worker runs on `localhost`
- Notifications work in Chrome, Firefox, Edge
- Safari has limited support

### Production
- Must use HTTPS
- Register domain in Firebase Console
- Update CORS settings if needed

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full support |
| Firefox | ✅ Full support |
| Edge | ✅ Full support |
| Safari | ⚠️ Limited (iOS 16.4+) |
| Opera | ✅ Full support |

## Security Considerations

1. **FCM tokens are stored securely** in the database
2. **Tokens are invalidated** when user logs out (localStorage cleared)
3. **Backend validates** all notification requests
4. **Only authenticated users** can receive notifications
5. **Users can disable** notifications at any time

## Future Enhancements

- [ ] Notification preferences (which task types to notify)
- [ ] Custom notification schedules
- [ ] Snooze functionality
- [ ] Notification history
- [ ] Rich notifications with images
- [ ] Action buttons in notifications (Mark as Complete)




