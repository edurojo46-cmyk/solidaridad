// SOLIDARIDAD sw.js — Clean dummy SW
// This just bypasses itself and deletes caches, but does NOT force reload.

self.addEventListener('install', function(event) {
    console.log('[SW] SOLIDARIDAD install — cleaning caches');
    event.waitUntil(
        caches.keys().then(function(names) {
            return Promise.all(names.map(function(n) {
                return caches.delete(n);
            }));
        }).then(function() {
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', function(event) {
    console.log('[SW] SOLIDARIDAD activate');
    event.waitUntil(
        caches.keys().then(function(names) {
            return Promise.all(names.map(function(n) { return caches.delete(n); }));
        }).then(function() {
            return Promise.resolve();
        }).then(function() {
            return Promise.resolve();
        })
    );
});

self.addEventListener('fetch', function(event) {
    // Pass-through everything to network
    event.respondWith(fetch(event.request));
});
