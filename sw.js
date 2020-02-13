'use strict'

var CACHE_SHELL = 'pwa-news-shell-v1';
var CACHE_DATA = 'pwa-news-data-v1';
var API = 'https://newsapi.org/v2/';
var FILES_SHELL = [
    '/',
    '/css/main.css',
    '/css/materialize.min.css',
    '/images/placeholder-image.png',
    '/js/api.js',
    '/library/jquery-3.2.1.min.js',
    '/library/lazyload.js',
    '/library/materialize.min.js',
    '/library/moment.min.js'
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        self.caches.open(CACHE_SHELL)
            .then(function (cache) {
                return cache.addAll(FILES_SHELL);
            })
    )
});

self.addEventListener('activate', function (event) {
    var cacheWhitelist = [CACHE_SHELL, CACHE_DATA];
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});


self.addEventListener('fetch', function (event) {
    if (event.request.url.indexOf(API) === -1) {
        event.respondWith(
            caches.match(event.request)
                .then(function (response) {
                    if (response) {
                        return response;
                    } return fetch(event.request);
                })
        )
    } else {
        event.respondWith(
            self.fetch(event.request)
                .then(function (response) {
                    return caches.open(CACHE_DATA)
                        .then(function (cache) {
                            cache.put(event.request.url, response.clone());
                            return response;
                        })
                })
                .catch(function (err) {
                    return caches.match(event.request);
                })
        )
    }
});

self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push Received.');
    console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

    const title = 'PWA News';
    const options = {
        body: 'Push notification',
        icon: 'images/icons/android-chrome-192x192.png',
        badge: 'images/icons/favicon-32x32.png',
        vibrate: [500]
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    event.waitUntil(
        clients.openWindow('/')
    )
})