const CACHE_NAME = 'foodx-v15';
const ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './js/data.js',
    './js/storage.js',
    './js/app.js',
    './manifest.json'
];

// Install Event
self.addEventListener('install', (e) => {
    self.skipWaiting(); // Force the waiting service worker to become the active service worker
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Clearing Old Cache');
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event
self.addEventListener('fetch', (e) => {
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
