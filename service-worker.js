const CACHE_NAME = 'our-kitchen-chronicles-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/pages/recipe-page.html',
  '/styles/main.css',
  '/js/navigation-script.js',
  '/js/recipe-data.js',
  '/js/featured-recipes.js',
  '/img/category-jars/optimized/',
  '/img/background/stone-counter-top.jpg',
  '/img/background/wood-texture.jpg'
  // Add other critical assets here
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});