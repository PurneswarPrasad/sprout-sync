# Firebase Push Notifications Setup Guide

This guide will help you set up Firebase Cloud Messaging (FCM) for the Plant Care App to send push notifications for overdue plant care tasks.

## Prerequisites

1. A Firebase project set up in the [Firebase Console](https://console.firebase.google.com/)
2. Your web app registered in Firebase
3. Firebase service account JSON file

## Step 1: Firebase Console Setup

### 1.1 Enable Cloud Messaging
1. Go to your Firebase project in the [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Cloud Messaging** in the left sidebar
3. Click **Get started** if you haven't already

### 1.2 Generate Web Push Certificate (VAPID Key)
1. In Cloud Messaging, go to the **Web Push certificates** tab
2. Click **Generate key pair** if you don't have one
3. Copy the generated key pair - you'll need this for the frontend

### 1.3 Get Firebase Configuration
1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Find your web app and click the **Config** button
4. Copy the `firebaseConfig` object

## Step 2: Backend Configuration

### 2.1 Environment Variables
Add these variables to your `backend/.env` file:

```env
# Firebase Configuration (for push notifications)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY_ID=your_firebase_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_firebase_private_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_CLIENT_ID=your_firebase_client_id

# Frontend URL (for notification links)
FRONTEND_URL=http://localhost:5173
```

### 2.2 Get Service Account JSON
1. Go to **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. Extract the values from the JSON and add them to your `.env` file:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key_id` → `FIREBASE_PRIVATE_KEY_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `client_id` → `FIREBASE_CLIENT_ID`

### 2.3 Install Dependencies
```bash
cd backend
npm install firebase-admin cron
npm install --save-dev @types/cron
```

## Step 3: Frontend Configuration

### 3.1 Environment Variables
Add these variables to your `frontend/.env` file:

```env
# Firebase Configuration (for push notifications)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Firebase VAPID Key (for web push)
VITE_FIREBASE_VAPID_KEY=your_firebase_vapid_key

# API Base URL
VITE_API_BASE_URL=http://localhost:3001
```

### 3.2 Install Dependencies
```bash
cd frontend
npm install firebase
```

### 3.3 Update Service Worker
Update the `frontend/public/firebase-messaging-sw.js` file with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "your_firebase_api_key",
  authDomain: "your_project_id.firebaseapp.com",
  projectId: "your_firebase_project_id",
  storageBucket: "your_project_id.appspot.com",
  messagingSenderId: "your_firebase_messaging_sender_id",
  appId: "your_firebase_app_id",
};
```

## Step 4: Database Migration

Run the database migration to update the schema:

```bash
cd backend
npx prisma db push
```

This will update the `UserSettings` table to replace `onesignalPlayerId` with `fcmToken`.

## Step 5: Testing

### 5.1 Start the Servers
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

### 5.2 Test Notifications
1. Open your app in a browser
2. Go to the notification settings page
3. Enable notifications when prompted
4. Use the test notification endpoint: `POST /api/notifications/test`

### 5.3 Check Scheduler Status
```bash
GET /api/notifications/scheduler-status
```

## Step 6: Production Deployment

### 6.1 Update Environment Variables
Make sure all environment variables are set in your production environment.

### 6.2 Update Service Worker
Deploy the updated `firebase-messaging-sw.js` file to your production server.

### 6.3 Verify HTTPS
Firebase push notifications require HTTPS in production.

## Notification Features

### Message Templates
The system includes 5 different message templates for each task type:
- **Watering**: "Time to water your {plantName}!"
- **Fertilizing**: "Fertilizer due for {plantName}"
- **Spraying**: "Misting time for {plantName}"
- **Pruning**: "Pruning due for {plantName}"
- **Sun Rotation**: "Rotate your {plantName}"

### User Personas
Messages are customized based on user persona:
- **Primary**: Professional, structured reminders
- **Secondary**: Friendly, collaborative nudges
- **Tertiary**: Supportive encouragement for beginners

### Notification Cycling
- Notifications are sent every 3 minutes for overdue tasks
- If a user has multiple overdue tasks, notifications cycle through them
- Each notification cycle uses a different message variation

## API Endpoints

### FCM Token Management
- `POST /api/notifications/fcm-token` - Update user's FCM token
- `GET /api/notifications/overdue-tasks` - Get user's overdue tasks

### Task Management
- `POST /api/notifications/mark-task-completed` - Mark a task as completed

### Admin/Testing
- `GET /api/notifications/stats` - Get notification statistics
- `POST /api/notifications/test` - Send test notification
- `POST /api/notifications/trigger` - Manually trigger notification process
- `GET /api/notifications/scheduler-status` - Get scheduler status

## Troubleshooting

### Common Issues

1. **"Firebase messaging not supported"**
   - Ensure you're using HTTPS in production
   - Check that the service worker is properly registered

2. **"Invalid FCM token"**
   - FCM tokens can expire, the system automatically removes invalid tokens
   - Users need to refresh their tokens periodically

3. **"Notification permission denied"**
   - Users need to manually enable notifications in browser settings
   - Clear browser data and try again

4. **"Service worker not found"**
   - Ensure `firebase-messaging-sw.js` is in the `public` directory
   - Check that the file is accessible at the root of your domain

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your backend environment.

## Security Considerations

1. **Service Account**: Keep your Firebase service account JSON secure
2. **Environment Variables**: Never commit `.env` files to version control
3. **HTTPS**: Always use HTTPS in production for push notifications
4. **Token Validation**: The system validates FCM tokens and removes invalid ones

## Monitoring

Monitor your notification system using:
- Firebase Console → Cloud Messaging → Reports
- Backend logs for notification delivery status
- Database logs for FCM token updates
- Scheduler status endpoint for cron job health

