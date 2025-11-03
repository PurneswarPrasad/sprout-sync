/* eslint-disable no-undef */
// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Import Workbox for caching
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

// Initialize Firebase in the service worker
// These values will be replaced at build time
let messaging = null;
let firebaseInitError = null;

try {
  firebase.initializeApp({
    apiKey: 'AIzaSyCvGroapiD2zaASuP52cVj38Czz0uLjW4A',
    authDomain: 'sprout-sync.firebaseapp.com',
    projectId: 'sprout-sync',
    storageBucket: 'sprout-sync.firebasestorage.app',
    messagingSenderId: '828900454133',
    appId: '1:828900454133:web:5393445809d839f0e11fbc',
  });
  
  try {
    messaging = firebase.messaging();
    console.log('🔥 Firebase Messaging initialized in service worker');
  } catch (error) {
    firebaseInitError = error;
    console.error('Error initializing Firebase Messaging in service worker:', {
      error: error.message || error,
      stack: error.stack,
      userAgent: navigator.userAgent,
      serviceWorkerScope: self.registration?.scope,
    });
  }
} catch (error) {
  firebaseInitError = error;
  console.error('Error initializing Firebase in service worker:', {
    error: error.message || error,
    stack: error.stack,
    userAgent: navigator.userAgent,
    serviceWorkerScope: self.registration?.scope,
  });
}

// Configure Workbox
if (workbox) {
  console.log('Workbox loaded successfully');
  
  // Precache static assets
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);
  
  // Cache Cloudinary images
  workbox.routing.registerRoute(
    /^https:\/\/res\.cloudinary\.com\/.*/i,
    new workbox.strategies.CacheFirst({
      cacheName: 'cloudinary-images',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
      ],
    })
  );
  
  // Cache API responses with network-first strategy
  workbox.routing.registerRoute(
    /^https:\/\/.*\/api\/.*/i,
    new workbox.strategies.NetworkFirst({
      cacheName: 'api-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
        }),
      ],
    })
  );
} else {
  console.error('Workbox failed to load in service worker');
}

// Handle background messages
if (messaging) {
  try {
    messaging.onBackgroundMessage((payload) => {
      console.log('Background message received:', payload);

      try {
        const notificationTitle = payload.notification?.title || 'SproutSync';
        const notificationOptions = {
          body: payload.notification?.body || '',
          icon: '/plant.png',
          badge: '/plant.png',
          tag: payload.data?.taskId || 'notification',
          data: payload.data,
          requireInteraction: false,
          actions: [
            {
              action: 'view',
              title: 'View Plant',
            },
            {
              action: 'dismiss',
              title: 'Dismiss',
            },
          ],
        };

        self.registration.showNotification(notificationTitle, notificationOptions).catch((error) => {
          console.error('Error showing notification in service worker:', {
            error: error.message || error,
            stack: error.stack,
            payload,
            userAgent: navigator.userAgent,
            notificationPermission: Notification.permission,
          });
        });

        // Auto-dismiss after 10 seconds
        setTimeout(() => {
          self.registration.getNotifications({ tag: notificationOptions.tag })
            .then((notifications) => {
              notifications.forEach((notification) => {
                try {
                  notification.close();
                } catch (error) {
                  console.error('Error closing notification:', {
                    error: error.message || error,
                    stack: error.stack,
                  });
                }
              });
            })
            .catch((error) => {
              console.error('Error getting notifications for dismiss:', {
                error: error.message || error,
                stack: error.stack,
              });
            });
        }, 10000);
      } catch (error) {
        console.error('Error handling background message:', {
          error: error.message || error,
          stack: error.stack,
          payload,
          userAgent: navigator.userAgent,
        });
      }
    });
  } catch (error) {
    console.error('Error setting up background message handler:', {
      error: error.message || error,
      stack: error.stack,
      firebaseInitError: firebaseInitError?.message || firebaseInitError,
      userAgent: navigator.userAgent,
    });
  }
} else {
  console.error('Firebase Messaging not available in service worker:', {
    firebaseInitError: firebaseInitError?.message || firebaseInitError,
    firebaseInitErrorStack: firebaseInitError?.stack,
    userAgent: navigator.userAgent,
  });
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  try {
    event.notification.close();
  } catch (error) {
    console.error('Error closing notification on click:', {
      error: error.message || error,
      stack: error.stack,
    });
  }

  if (event.action === 'dismiss') {
    return;
  }

  // Navigate to plant detail page
  const plantId = event.notification.data?.plantId;
  if (plantId) {
    const urlToOpen = `/plants/${plantId}`;
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          try {
            // Check if there's already a window open
            for (const client of clientList) {
              if (client.url.includes(plantId) && 'focus' in client) {
                return client.focus();
              }
            }
            // If no window found, open a new one
            if (clients.openWindow) {
              return clients.openWindow(urlToOpen);
            }
          } catch (error) {
            console.error('Error handling notification click navigation:', {
              error: error.message || error,
              stack: error.stack,
              plantId,
              urlToOpen,
            });
            throw error;
          }
        })
        .catch((error) => {
          console.error('Error in notification click handler:', {
            error: error.message || error,
            stack: error.stack,
            plantId,
            urlToOpen,
            userAgent: navigator.userAgent,
          });
        })
    );
  } else {
    console.warn('Notification clicked but no plantId in data:', event.notification.data);
  }
});


