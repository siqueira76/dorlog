/**
 * Firebase Cloud Messaging Service Worker
 * Handles background push notifications for FibroDiário PWA
 * 
 * This service worker must be registered in the root of the domain
 * to enable push notifications in all pages of the application
 */

// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration
// Note: This config is safe to expose as it's a client-side configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0jOcON4chsTw-_f5Z8TXdK8ryuzoQsZ0",
  authDomain: "dorlog-fibro-diario.firebaseapp.com",
  projectId: "dorlog-fibro-diario",
  storageBucket: "dorlog-fibro-diario.firebasestorage.app",
  messagingSenderId: "1005551706966",
  appId: "1:1005551706966:web:f75e761d5a57767fc1ecf7"
};

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);

// Retrieve Firebase Messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensagem recebida em background:', payload);

  // Customize notification based on payload
  const notificationTitle = payload.notification?.title || 'FibroDiário';
  const notificationOptions = {
    body: payload.notification?.body || 'Nova notificação',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: payload.data?.type || 'general',
    data: payload.data,
    vibrate: [200, 100, 200],
    requireInteraction: payload.data?.priority === 'high'
  };

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notificação clicada:', event.notification.tag);
  
  event.notification.close();

  // Determine which page to open based on notification type
  const urlToOpen = getUrlForNotificationType(event.notification.data?.type);

  // Open or focus the app window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

/**
 * Determines which URL to open based on notification type
 * @param {string} notificationType - Type of notification
 * @returns {string} URL to open
 */
function getUrlForNotificationType(notificationType) {
  const baseUrl = self.location.origin;
  
  switch (notificationType) {
    case 'morning_quiz':
    case 'evening_quiz':
      return `${baseUrl}/quiz`;
    
    case 'medication_reminder':
      return `${baseUrl}/medicamentos`;
    
    case 'health_insights':
    case 'report_ready':
      return `${baseUrl}/relatorios`;
    
    case 'emergency_alert':
      return `${baseUrl}/emergencia`;
    
    default:
      return baseUrl;
  }
}

// Service worker installation
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker instalado');
  self.skipWaiting();
});

// Service worker activation
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker ativado');
  event.waitUntil(clients.claim());
});
