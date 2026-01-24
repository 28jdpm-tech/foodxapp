const CACHE_NAME = 'foodx-v1';
const ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './js/data.js',
    './js/storage.js',
    './js/app.js'
];

// Install Event
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Fetch Event
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((res) => {
            return res || fetch(e.request);
        })
    );
});
