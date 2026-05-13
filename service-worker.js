// Service Worker para Sistema de Ventas - Versión optimizada para Android
const CACHE_NAME = 'ventas-app-v3.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/modules/utils.js',
  '/modules/data-manager.js',
  '/modules/category-manager.js',
  '/modules/product-manager.js',
  '/modules/sales-manager.js',
  '/modules/history-manager.js',
  '/modules/ui-manager.js',
  '/modules/backup-manager.js',
  '/modules/purchase-manager.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then(cache => {
      console.log('[Service Worker] Cacheando archivos');
      return cache.addAll(urlsToCache);
    })
    .then(() => {
      console.log('[Service Worker] Instalación completada');
      return self.skipWaiting();
    })
  );
});

// Activar Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activación completada');
      return self.clients.claim();
    })
  );
});

// Interceptar solicitudes
self.addEventListener('fetch', event => {
  if (event.request.url.includes('data:')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
    .then(response => {
      if (response) {
        return response;
      }
      
      return fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        })
        .catch(error => {
          console.error('[Service Worker] Error en fetch:', error);
          
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }
          
          return new Response('Recurso no disponible offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
    })
  );
});

// Sincronización en segundo plano para Android
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    console.log('[Service Worker] Sincronizando datos...');
    event.waitUntil(syncData());
  }
});

async function syncData() {
  console.log('[Service Worker] Sincronización completada');
}

// Notificaciones push para Android
self.addEventListener('push', event => {
  console.log('[Service Worker] Notificación push recibida', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación del sistema',
    icon: 'icons/icon-192x192.png',
    badge: 'icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir app'
      },
      {
        action: 'dismiss',
        title: 'Cerrar'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Sistema de Ventas', options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notificación clickeada', event.notification.tag);
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {
        for (let client of windowClients) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});