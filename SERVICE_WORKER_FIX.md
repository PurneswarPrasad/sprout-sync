# Service Worker Infinite Loop Fix

## Problem
The application was experiencing infinite rendering loops in production due to **conflicting service workers**:
1. **VitePWA** was generating `/sw.js` (Workbox service worker)
2. **Firebase** was registering `/firebase-messaging-sw.js` 
3. Both were trying to control the same scope (`/`), causing registration conflicts
4. The `window.location.reload()` in the controlling event was triggering infinite reload loops

## Root Causes
1. **Dual Service Worker Registration**: Two separate service workers competing for control
2. **Auto-reload on Update**: VitePWA's `autoUpdate` with reload on `controlling` event
3. **Navigation Fallback Conflicts**: VitePWA's navigation fallback interfering with Firebase SW
4. **No Duplicate Prevention**: No checks to prevent repeated service worker registrations

## Solution

### 1. Unified Service Worker Strategy
- **Use Firebase service worker as the primary service worker**
- **Integrate Workbox caching into Firebase service worker**
- **Disable VitePWA's automatic service worker registration**

### 2. Changes Made

#### `vite.config.ts`
```typescript
VitePWA({
  registerType: 'prompt',           // Changed from 'autoUpdate'
  devOptions: {
    enabled: false,                 // Disabled in dev to prevent conflicts
  },
  injectRegister: false,            // Don't auto-inject registration
  // ... rest of config
})
```

#### `src/utils/pwa.ts`
```typescript
export const registerSW = () => {
  // Service worker registration delegated to Firebase
  console.log('Service worker registration delegated to Firebase');
};
```

#### `src/services/notificationService.ts`
```typescript
async initialize(): Promise<void> {
  // Register Firebase service worker only once
  const existingRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
  
  if (!existingRegistration) {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    console.log('Firebase Service Worker registered:', registration);
  } else {
    console.log('Firebase Service Worker already registered');
  }
  // ...
}
```

#### `public/firebase-messaging-sw.js`
- **Added Workbox integration** for caching
- **Configured caching strategies** for Cloudinary images and API responses
- **Single service worker** handles both Firebase messaging and PWA caching

```javascript
// Import Workbox
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

// Configure caching strategies
workbox.routing.registerRoute(
  /^https:\/\/res\.cloudinary\.com\/.*/i,
  new workbox.strategies.CacheFirst({
    cacheName: 'cloudinary-images',
    // ...
  })
);
```

## Benefits
1. ✅ **No More Infinite Loops**: Single service worker, no conflicts
2. ✅ **Proper Caching**: Workbox caching integrated into Firebase SW
3. ✅ **Firebase Notifications Work**: Background push notifications functional
4. ✅ **Better Performance**: Optimized caching strategies
5. ✅ **Production Ready**: No reload loops or registration conflicts

## Testing
1. **Clear all service workers** in DevTools → Application → Service Workers
2. **Clear cache** in DevTools → Application → Clear storage
3. **Reload the application**
4. **Verify only one service worker** is registered (`/firebase-messaging-sw.js`)
5. **Test notifications** (both foreground and background)
6. **Check caching** is working for images and API calls

## Deployment Notes
- Make sure to **clear old service workers** on production
- Users may need to **hard refresh** (Ctrl+Shift+R / Cmd+Shift+R) once
- Monitor for any service worker errors in production logs

