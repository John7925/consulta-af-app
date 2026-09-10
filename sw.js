const CACHE = 'consulta-af-shell-v0.2';

const APP_SHELL = [
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(APP_SHELL))
  );

  self.skipWaiting();
});


self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(
            key =>
              key.startsWith('consulta-af-shell-') &&
              key !== CACHE
          )
          .map(
            key => caches.delete(key)
          )
      )
    )
  );

  self.clients.claim();
});


self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // La aplicación oficial de Apps Script es externa.
  // No se intercepta ni se almacena en caché.
  if (url.origin !== self.location.origin) {
    return;
  }


  // Para navegación se intenta obtener primero
  // la versión más reciente publicada.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();

          caches
            .open(CACHE)
            .then(
              cache =>
                cache.put(
                  './index.html',
                  copy
                )
            );

          return response;
        })
        .catch(
          () =>
            caches.match(
              './index.html'
            )
        )
    );

    return;
  }


  // Para archivos propios de la PWA:
  // primero caché y después red.
  event.respondWith(
    caches
      .match(request)
      .then(cached => {
        if (cached) {
          return cached;
        }

        return fetch(request)
          .then(response => {
            if (
              response &&
              response.ok
            ) {
              const copy =
                response.clone();

              caches
                .open(CACHE)
                .then(
                  cache =>
                    cache.put(
                      request,
                      copy
                    )
                );
            }

            return response;
          });
      })
  );
});
