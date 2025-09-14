// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCvGroapiD2zaASuP52cVj38Czz0uLjW4A",
  authDomain: "sprout-sync.firebaseapp.com",
  projectId: "sprout-sync",
  storageBucket: "sprout-sync.firebasestorage.app",
  messagingSenderId: "828900454133",
  appId: "1:828900454133:web:5393445809d839f0e11fbc"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Store current user ID in service worker scope
let currentUserId = null;

// Listen for messages from the main thread to update current user
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_USER_ID') {
    currentUserId = event.data.userId;
    console.log('Service Worker: Current user set to:', currentUserId);
  } else if (event.data && event.data.type === 'CLEAR_USER_ID') {
    currentUserId = null;
    console.log('Service Worker: Current user cleared');
  }
});

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  // Filter messages by current user ID
  if (currentUserId && payload.data?.userId && payload.data.userId !== currentUserId) {
    console.log('Service Worker: Message not for current user, ignoring. Expected:', currentUserId, 'Got:', payload.data.userId);
    return;
  }
  
  console.log('Service Worker: Processing message for current user:', currentUserId);
  
  // Check if the app is in the foreground by checking if there are any active clients
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    const hasActiveClient = clients.some(client => client.visibilityState === 'visible');
    
    if (hasActiveClient) {
      console.log('Service Worker: App is in foreground, not showing background notification');
      return;
    }
    
    console.log('Service Worker: App is in background, showing notification with actions');
    
    const notificationTitle = payload.notification?.title || 'Plant Care';
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new notification',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: payload.data?.taskId || 'plant-care-notification',
      requireInteraction: true,
      actions: [
        {
          action: 'mark_done',
          title: 'Mark Done',
          icon: '/pwa-192x192.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ],
      data: payload.data
    };

    // Show notification
    self.registration.showNotification(notificationTitle, notificationOptions);
  });
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'mark_done') {
    // Handle mark done action
    const taskId = event.notification.data?.taskId;
    const plantId = event.notification.data?.plantId;
    
    if (taskId) {
      // Open the app and mark the task as done
      event.waitUntil(
        clients.openWindow(`/plants/${plantId}?markTask=${taskId}`)
      );
    }
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default click - open the app
    const plantId = event.notification.data?.plantId;
    event.waitUntil(
      clients.openWindow(plantId ? `/plants/${plantId}` : '/')
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});

