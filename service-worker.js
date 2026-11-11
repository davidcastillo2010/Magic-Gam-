const CACHE_NAME = "magic-gam-v2";

const APP_FILES = [
  "/Magic-Gam-/",
  "/Magic-Gam-/index.html",
  "/Magic-Gam-/manifest.json",
  "/Magic-Gam-/icon-192.png",
  "/Magic-Gam-/icon-512.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.ok) {
        const copy = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, copy);
        });
      }

      return response;
    }).catch(() =>
      caches.match(event.request).then(response =>
        response || caches.match("/Magic-Gam-/")
      )
    )
  );
});
