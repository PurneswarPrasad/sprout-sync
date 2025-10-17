/* eslint-disable no-undef */
// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Import Workbox for caching
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

// Initialize Firebase in the service worker
// These values will be replaced at build time
firebase.initializeApp({
  apiKey: 'AIzaSyCvGroapiD2zaASuP52cVj38Czz0uLjW4A',
  authDomain: 'sprout-sync.firebaseapp.com',
  projectId: 'sprout-sync',
  storageBucket: 'sprout-sync.firebasestorage.app',
  messagingSenderId: '828900454133',
  appId: '1:828900454133:web:5393445809d839f0e11fbc',
});

const messaging = firebase.messaging();

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
  console.log('Workbox failed to load');
}

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

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

  self.registration.showNotification(notificationTitle, notificationOptions);

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    self.registration.getNotifications({ tag: notificationOptions.tag }).then((notifications) => {
      notifications.forEach((notification) => notification.close());
    });
  }, 10000);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Navigate to plant detail page
  const plantId = event.notification.data?.plantId;
  if (plantId) {
    const urlToOpen = `/plants/${plantId}`;
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
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
      })
    );
  }
});


