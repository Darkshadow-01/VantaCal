const CACHE_NAME = "vancal-v2";
const STATIC_ASSETS = [
  "/",
  "/calendar",
  "/manifest.json",
  "/icon-192.svg",
  "/icon-512.svg",
];

const CACHE_STRATEGIES = {
  CACHE_FIRST: "cache-first",
  NETWORK_FIRST: "network-first",
  STALE_WHILE_REVALIDATE: "stale-while-revalidate",
};

const OFFLINE_PAGE = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        await cache.addAll(STATIC_ASSETS);
      } catch (error) {
        console.warn("Failed to cache some static assets:", error);
      }
      return cache;
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || 
      url.pathname.endsWith(".js") || 
      url.pathname.endsWith(".css") ||
      url.pathname.endsWith(".woff2") ||
      url.pathname.endsWith(".woff")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.pathname.includes(".") && !url.pathname.startsWith("/api/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.pathname === "/offline.html") {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedOffline = await caches.match(request);
    if (cachedOffline) {
      return cachedOffline;
    }
    return new Response("Offline - Resource not available", { 
      status: 503,
      statusText: "Service Unavailable"
    });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response(JSON.stringify({ 
      error: "You are offline", 
      cached: false,
      message: "This data was not cached for offline access"
    }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    return cached;
  }

  return fetchPromise || new Response("Offline", { status: 503 });
}

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-events") {
    event.waitUntil(syncEvents());
  }
  if (event.tag === "sync-pending-operations") {
    event.waitUntil(syncPendingOperations());
  }
});

async function syncEvents() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: "SYNC_STARTED", timestamp: Date.now() });
    });

    const response = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync" }),
    });

    if (response.ok) {
      const data = await response.json();
      clients.forEach((client) => {
        client.postMessage({ type: "SYNC_COMPLETED", data });
      });
    }
  } catch (error) {
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: "SYNC_FAILED", error: error.message });
    });
  }
}

async function syncPendingOperations() {
  try {
    const pendingOps = await getPendingOperations();
    for (const op of pendingOps) {
      try {
        await processOperation(op);
        await removePendingOperation(op.id);
      } catch (error) {
        console.error("Failed to sync operation:", op.id, error);
      }
    }
  } catch (error) {
    console.error("Failed to sync pending operations:", error);
  }
}

async function getPendingOperations() {
  const cache = await caches.open(CACHE_NAME);
  const response = await cache.match("/pending-operations.json");
  if (response) {
    return response.json();
  }
  return [];
}

async function removePendingOperation(id) {
  console.log("Operation synced:", id);
}

async function processOperation(operation) {
  console.log("Processing operation:", operation);
}

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data && event.data.type === "QUEUE_OPERATION") {
    queueOperation(event.data.operation);
  }
});

async function queueOperation(operation) {
  const cache = await caches.open(CACHE_NAME);
  const pendingOps = await getPendingOperations();
  pendingOps.push({
    ...operation,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    queuedAt: Date.now(),
  });
  await cache.put("/pending-operations.json", new Response(JSON.stringify(pendingOps)));

  if ("serviceWorker" in navigator && "sync" in self.registration) {
    await self.registration.sync.register("sync-pending-operations");
  }
}

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  
  const options = {
    body: data.body || "New notification",
    icon: "/icon-192.svg",
    badge: "/icon-192.svg",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.id,
      url: data.url || "/calendar",
    },
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "VanCal", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === event.notification.data.url && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(event.notification.data.url);
      }
    })
  );
});