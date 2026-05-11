/* eslint-env serviceworker */
/* global importScripts, firebase */

// Firebase Cloud Messaging service worker.
//
// Registered separately from the main caching service worker (see
// public/service-worker.js) and explicitly passed to getToken() via
// `serviceWorkerRegistration`. Firebase config is supplied through the
// registration URL's query string so this file stays free of hard-coded
// values per-environment.

const FIREBASE_VERSION = '11.6.1';

importScripts(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app-compat.js`);
importScripts(
  `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-messaging-compat.js`,
);

const params = new URLSearchParams(location.search);
firebase.initializeApp({
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  storageBucket: params.get('storageBucket'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const notification = payload.notification || {};
  const title = notification.title || data.title || 'Our Kitchen Chronicles';
  const options = {
    body: notification.body || data.body || '',
    icon: '/img/icon/prod/wooden-spoon-192.png',
    badge: '/img/icon/prod/wooden-spoon-32.png',
    data,
    tag: data.tag || data.type || 'default',
  };
  return self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of allClients) {
        const url = new URL(client.url);
        if (url.origin === self.location.origin) {
          await client.focus();
          if ('navigate' in client) {
            try {
              await client.navigate(targetUrl);
            } catch (_) {
              // Some browsers disallow cross-origin navigate; ignore.
            }
          }
          return;
        }
      }
      await self.clients.openWindow(targetUrl);
    })(),
  );
});
