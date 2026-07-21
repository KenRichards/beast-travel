export const PWA_SCHEMA_VERSION = "bt-025-v1";
export const PWA_CACHE_PREFIX = "beast-travel";

export const CORE_OFFLINE_ROUTES = [
  "/",
  "/today",
  "/timeline",
  "/travel-pack",
  "/reservations",
  "/trips/switzerland-2026/logistics",
  ...Array.from(
    { length: 4 },
    (_, index) => `/trips/switzerland-2026/day/${index + 1}`,
  ),
  "/offline",
] as const;

export const TRAVEL_DATA_ROUTES = [
  "/api/offline/itinerary",
  "/api/offline/reservations",
  "/api/offline/inbox",
  "/api/offline/travel-pack",
] as const;

export const SYNC_PAGE_ROUTES = [
  "/today",
  "/timeline",
  "/travel-pack",
  "/reservations",
  "/travel-inbox",
  "/trips/switzerland-2026/logistics",
] as const;

export const CORE_STATIC_ASSETS = [
  "/branding/logo.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/images/switzerland-hero.jpg",
  "/images/destinations/zurich.jpg",
  "/images/destinations/lucerne.jpg",
  "/images/destinations/grindelwald.jpg",
  "/images/destinations/jungfraujoch.jpg",
] as const;

export function normalizeDeploymentId(value?: unknown): string {
  const normalized = typeof value === "string"
    ? value.trim().replace(/[^a-zA-Z0-9._-]/g, "-")
    : "";
  return normalized || "local";
}

export function createCacheNames(deploymentId?: unknown) {
  const version = `${PWA_SCHEMA_VERSION}-${normalizeDeploymentId(deploymentId)}`;
  return {
    version,
    pages: `${PWA_CACHE_PREFIX}-pages-${version}`,
    assets: `${PWA_CACHE_PREFIX}-assets-${version}`,
    data: `${PWA_CACHE_PREFIX}-data-${version}`,
    images: `${PWA_CACHE_PREFIX}-images-${version}`,
  } as const;
}

export function cachesToInvalidate(
  cacheNames: readonly string[],
  currentNames: ReturnType<typeof createCacheNames>,
): string[] {
  const active = new Set(Object.values(currentNames));
  return cacheNames.filter(
    (name) => name.startsWith(`${PWA_CACHE_PREFIX}-`) && !active.has(name),
  );
}

export function offlineNavigationCacheKey(url: string): string {
  const parsed = new URL(url, "https://beast.travel");
  parsed.hash = "";
  parsed.searchParams.delete("_rsc");
  return `${parsed.pathname}${parsed.search}`;
}
