// sw.js faylini yarating
const CACHE_NAME = 'like-duel-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/enhanced-styles.css',
    '/main.js',
    '/gameLogic.js',
    '/ui.js',
    '/modal.js',
    '/quests.js',
    '/achievements.js',
    '/chat.js',
    '/stateManager.js',
    '/gameLogicImproved.js',
    '/socketManagerImproved.js',
    '/app.js',
    'https://cdn.socket.io/4.7.2/socket.io.min.js',
    'https://telegram.org/js/telegram-web-app.js',
    'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                
                return fetch(event.request).then(response => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                });
            })
    );
});

self.addEventListener('push', event => {
    const data = event.data.json();
    
    const options = {
        body: data.body,
        icon: '/icon-192.png',
        badge: '/icon-72.png',
        tag: data.tag,
        data: {
            url: data.url
        },
        actions: [
            {
                action: 'open',
                title: 'Ochish'
            },
            {
                action: 'close',
                title: 'Yopish'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow(event.notification.data.url || '/')
        );
    }
});