const CACHE_VERSION = "growfit-fa-v1";
const OFFLINE_URL = "/offline";

// App shell — pages that should always be cached on install
const SHELL = ["/", OFFLINE_URL];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_VERSION)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests from our own origin
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache: API routes, auth callbacks, Supabase, Next.js internals
  const skip =
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/webpack-hmr") ||
    url.pathname.includes("supabase");
  if (skip) return;

  // Static assets (_next/static) — cache-first, long-lived
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  // Navigation requests — network-first, fall back to cache then offline page
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigations for offline fallback
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached ?? (await caches.match(OFFLINE_URL));
        })
    );
    return;
  }

  // Everything else — network-first with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ─── Push notifications ───────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Growfit FA", body: event.data.text() };
  }
  event.waitUntil(
    self.registration
      .showNotification(data.title ?? "Growfit FA", {
        body: data.body,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        vibrate: [100, 50, 100],
        data: { url: data.url ?? "/" },
      })
      .catch(() => {
        // Notification display may fail if permission is revoked after subscription
      })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url ?? "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        const existing = windowClients.find((c) => c.url === target && "focus" in c);
        return existing ? existing.focus() : clients.openWindow(target);
      })
  );
});
