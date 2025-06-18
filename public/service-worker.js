const CACHE_NAME = 'our-kitchen-chronicles-spa-2024.12.18';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/styles/main.css',
  '/src/styles/base.css',
  '/src/styles/components/spa.css',
  '/src/styles/components/header.css',
  '/src/styles/components/footer.css',
  '/img/background/stone-counter-top.jpg',
  '/img/background/wood-texture.jpg',
  '/img/category-jars/optimized/appetizers.jpg',
  '/img/category-jars/optimized/main-course.webp',
  '/img/category-jars/optimized/side-dishes.jpeg',
  '/img/category-jars/optimized/soups&stews.jpg',
  '/img/category-jars/optimized/salad.jpg',
  '/img/category-jars/optimized/dessert.jpg',
  '/img/category-jars/optimized/breakfast.jpeg',
  '/img/category-jars/optimized/snacks.jpg',
  '/img/category-jars/optimized/beverages.jpg',
  // Add other critical assets here
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      console.log('Opened cache');
      return cache.addAll(urlsToCache).catch(function(error) {
        console.warn('Failed to cache some resources:', error);
        // Don't fail the install if some resources can't be cached
        return Promise.resolve();
      });
    }),
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      // Cache hit - return response
      if (response) {
        return response;
      }

      // IMPORTANT: Clone the request. A request is a stream and
      // can only be consumed once.
      var fetchRequest = event.request.clone();

      return fetch(fetchRequest).then(function (response) {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // IMPORTANT: Clone the response. A response is a stream
        // and because we want the browser to consume the response
        // as well as the cache consuming the response, we need
        // to clone it so we have two streams.
        var responseToCache = response.clone();

        // Check if the request is for an image in the optimized folder
        if (event.request.url.includes('/img/category-jars/optimized/')) {
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      }).catch(function(error) {
        console.warn('Fetch failed for:', event.request.url, error);
        // Return a generic response or cached fallback
        return new Response('Resource not available', { 
          status: 404, 
          statusText: 'Not Found' 
        });
      });
    }),
  );
});
