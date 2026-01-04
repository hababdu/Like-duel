// sw.js faylini yarating
const CACHE_NAME = 'like-duel-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/main.js',
    '/utils.js',
    '/gameLogic.js',
    '/icon-192.png',
    '/icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

self.addEventListener('push', event => {
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/icon-192.png',
        badge: '/icon-72.png',
        tag: data.tag,
        data: data.url
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});