// Firebase Cloud Messaging Service Worker for Udhaar Book
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
// Note: This script uses the Firebase compat libraries to run inside the Service Worker
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window or open new
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

self.addEventListener('push', (event) => {
  if (event.data) {
    const payload = event.data.json();
    const title = payload.notification?.title || 'Udhaar Book Reminder';
    const options = {
      body: payload.notification?.body || 'You have loans requiring attention today.',
      icon: '/pwa-192x192.svg',
      badge: '/pwa-192x192.svg',
      vibrate: [200, 100, 200],
      data: payload.data || {},
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});
