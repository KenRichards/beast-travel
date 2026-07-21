import {
  CORE_OFFLINE_ROUTES,
  CORE_STATIC_ASSETS,
  PWA_CACHE_PREFIX,
  SYNC_PAGE_ROUTES,
  TRAVEL_DATA_ROUTES,
  createCacheNames,
} from "./cache";

export function buildServiceWorkerSource(deploymentId?: string): string {
  const names = createCacheNames(deploymentId);

  return `/* BEAST Travel service worker · ${names.version} */
const CACHE_PREFIX = ${JSON.stringify(PWA_CACHE_PREFIX)};
const CACHE_NAMES = ${JSON.stringify(names)};
const CORE_ROUTES = ${JSON.stringify(CORE_OFFLINE_ROUTES)};
const STATIC_ASSETS = ${JSON.stringify(CORE_STATIC_ASSETS)};
const DATA_ROUTES = ${JSON.stringify(TRAVEL_DATA_ROUTES)};
const SYNC_PAGES = ${JSON.stringify(SYNC_PAGE_ROUTES)};

function navigationKey(input) {
  const url = new URL(typeof input === "string" ? input : input.url, self.location.origin);
  url.hash = "";
  url.searchParams.delete("_rsc");
  return url.href;
}

async function putIfUsable(cache, key, response) {
  if (response && (response.ok || response.type === "opaque")) {
    await cache.put(key, response.clone());
  }
  return response;
}

async function cacheAssetsFromHtml(response) {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return;
  const html = await response.clone().text();
  const urls = new Set();
  for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    try {
      const url = new URL(match[1], self.location.origin);
      if (url.origin === self.location.origin &&
          (url.pathname.startsWith("/_next/static/") ||
           url.pathname.startsWith("/icons/") || url.pathname.startsWith("/branding/"))) {
        urls.add(url.href);
      }
    } catch {}
  }
  const cache = await caches.open(CACHE_NAMES.assets);
  await Promise.allSettled([...urls].map(async (url) => {
    const asset = await fetch(url, { cache: "no-store" });
    await putIfUsable(cache, url, asset);
  }));
}

async function cachePage(path) {
  const response = await fetch(path, { cache: "no-store", headers: { "x-beast-pwa": "precache" } });
  if (!response.ok) return response;
  const cache = await caches.open(CACHE_NAMES.pages);
  await cache.put(navigationKey(path), response.clone());
  await cacheAssetsFromHtml(response);
  return response;
}

async function cacheDataRoute(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) return null;
  const cache = await caches.open(CACHE_NAMES.data);
  await cache.put(path, response.clone());
  return response;
}

async function cacheReservationDetails(response) {
  if (!response) return;
  try {
    const data = await response.clone().json();
    await Promise.allSettled((data.reservations || []).map((reservation) =>
      cachePage("/reservations/" + reservation.id)
    ));
  } catch {}
}

async function precache() {
  const assetCache = await caches.open(CACHE_NAMES.assets);
  await Promise.allSettled(STATIC_ASSETS.map(async (path) => {
    const response = await fetch(path, { cache: "no-store" });
    await putIfUsable(assetCache, path, response);
  }));
  await Promise.allSettled(CORE_ROUTES.map(cachePage));
  const data = await Promise.allSettled(DATA_ROUTES.map(cacheDataRoute));
  const reservationsIndex = DATA_ROUTES.indexOf("/api/offline/reservations");
  const reservations = data[reservationsIndex];
  if (reservations?.status === "fulfilled") {
    await cacheReservationDetails(reservations.value);
  }
}

async function invalidateOldCaches() {
  const active = new Set(Object.values(CACHE_NAMES));
  const names = await caches.keys();
  await Promise.all(names.map((name) =>
    name.startsWith(CACHE_PREFIX + "-") && !active.has(name)
      ? caches.delete(name)
      : Promise.resolve(false)
  ));
}

async function notifyClients(message) {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of windows) client.postMessage(message);
}

async function syncTravelData() {
  try {
    const data = await Promise.all(DATA_ROUTES.map(cacheDataRoute));
    await Promise.allSettled(SYNC_PAGES.map(cachePage));
    const reservationsIndex = DATA_ROUTES.indexOf("/api/offline/reservations");
    await cacheReservationDetails(data[reservationsIndex]);
    await notifyClients({ type: "BEAST_SYNC_COMPLETE", updatedAt: Date.now() });
  } catch {
    await notifyClients({ type: "BEAST_SYNC_FAILED" });
  }
}

async function networkFirstPage(request) {
  const cache = await caches.open(CACHE_NAMES.pages);
  const key = navigationKey(request);
  const cacheable = new URL(request.url).pathname !== "/travel-inbox/preview";
  try {
    const response = await fetch(request);
    if (response.ok && cacheable) {
      await cache.put(key, response.clone());
      void cacheAssetsFromHtml(response);
    }
    return response;
  } catch {
    return (cacheable ? await cache.match(key) : undefined) ||
      (await cache.match(navigationKey("/offline"))) || Response.error();
  }
}

async function networkFirstData(request) {
  const cache = await caches.open(CACHE_NAMES.data);
  try {
    const response = await fetch(request);
    await putIfUsable(cache, request, response);
    return response;
  } catch {
    return (await cache.match(request)) || Response.error();
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  await putIfUsable(cache, request, response);
  return response;
}

async function imageCacheFirst(request) {
  const cache = await caches.open(CACHE_NAMES.images);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    await putIfUsable(cache, request, response);
    return response;
  } catch {
    const url = new URL(request.url);
    const assetCache = await caches.open(CACHE_NAMES.assets);
    const savedAsset = await assetCache.match(request);
    if (savedAsset) return savedAsset;
    const originalPath = url.origin === self.location.origin && url.pathname === "/_next/image"
      ? url.searchParams.get("url")
      : null;
    if (originalPath) {
      const original = (await cache.match(originalPath)) ||
        (await assetCache.match(originalPath));
      if (original) return original;
    }
    return Response.error();
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    await precache();
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await invalidateOldCaches();
    await self.clients.claim();
    await notifyClients({ type: "BEAST_SW_READY", version: CACHE_NAMES.version });
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "BEAST_SYNC_TRAVEL_DATA") {
    event.waitUntil(syncTravelData());
  }
  if (event.data?.type === "BEAST_SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (url.origin === self.location.origin &&
      (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc"))) {
    return;
  }

  if (url.origin === self.location.origin && url.pathname.startsWith("/api/offline/")) {
    event.respondWith(networkFirstData(request));
    return;
  }

  if (request.destination === "image") {
    event.respondWith(imageCacheFirst(request));
    return;
  }

  if (url.origin === self.location.origin &&
      (url.pathname.startsWith("/_next/static/") ||
       ["style", "script", "font", "worker"].includes(request.destination))) {
    event.respondWith(cacheFirst(request, CACHE_NAMES.assets));
  }
});
`;
}
