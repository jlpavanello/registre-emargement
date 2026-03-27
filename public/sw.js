const CACHE_NAME = 'emargement-v23';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// Installation : mise en cache des ressources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch : stratégie Network-First avec fallback cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// ── Web Push Notifications ──────────────────────────────

// Réception d'une notification push
self.addEventListener('push', (event) => {
  let data = {
    title: 'Nouveau message',
    body: '',
    icon: '/registre-emargement/icon-192.png',
    badge: '/registre-emargement/icon-192.png',
    data: { url: '/registre-emargement/' },
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    // Utilise les valeurs par défaut
  }

  const options = {
    body: data.body,
    icon: data.icon || '/registre-emargement/icon-192.png',
    badge: data.badge || '/registre-emargement/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'chat-message',
    renotify: true,
    data: data.data || { url: '/registre-emargement/' },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clic sur une notification push
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/registre-emargement/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si l'app est déjà ouverte, la mettre au premier plan
      for (const client of clientList) {
        if (client.url.includes('/registre-emargement') && 'focus' in client) {
          return client.focus();
        }
      }
      // Sinon ouvrir une nouvelle fenêtre
      return clients.openWindow(urlToOpen);
    })
  );
});
