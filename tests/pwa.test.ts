import assert from "node:assert/strict";
import test from "node:test";

import manifest from "../src/app/manifest";
import type { ApprovedReservation, NormalizedReservation } from "../src/lib/import/reservation";
import {
  CORE_OFFLINE_ROUTES,
  PWA_SCHEMA_VERSION,
  cachesToInvalidate,
  createCacheNames,
  offlineNavigationCacheKey,
} from "../src/lib/pwa/cache";
import { registerBeastServiceWorker } from "../src/lib/pwa/registration";
import { buildServiceWorkerSource } from "../src/lib/pwa/service-worker";
import {
  connectivityAfterEvent,
  formatSyncAge,
  getInstallExperience,
  shouldUseDocumentNavigation,
} from "../src/lib/pwa/status";
import { generateTravelPack, SWISS_EMERGENCY_CONTACTS } from "../src/lib/travel-pack";
import type { Itinerary } from "../src/types/itinerary";
import { validFlight, validHotel, validRentalCar } from "./helpers";

function approved(reservation: NormalizedReservation): ApprovedReservation {
  return {
    ...reservation,
    status: "approved",
    approvedAt: "2030-01-01T00:00:00.000Z",
    createdAt: "2030-01-01T00:00:00.000Z",
    modifiedAt: "2030-01-01T00:00:00.000Z",
  } as ApprovedReservation;
}

function itinerary(): Itinerary {
  return {
    trip: {
      id: "switzerland-test",
      title: "Switzerland test trip",
      subtitle: "July 2030",
      heroImage: "/test.jpg",
      timezone: "Europe/Zurich",
    },
    days: [{
      day: 1,
      date: "2030-07-10",
      title: "Arrival",
      icon: "plane",
      location: "Zurich",
      image: "/test.jpg",
      transport: "Train",
      travelTime: "15 minutes",
      budget: 100,
      description: "Arrival",
      map: { center: { latitude: 47, longitude: 8 }, zoom: 10 },
      locations: [{
        id: "station",
        name: "Zurich station",
        type: "station",
        coordinates: { latitude: 47, longitude: 8 },
        description: "Main station",
        address: "Bahnhofplatz, 8001 Zürich",
      }],
      schedule: [],
      travelSegments: [],
      dailyBudget: { transportation: 0, attractions: 0, food: 0, lodging: 0, miscellaneous: 0, total: 0, currency: "CHF" },
      notes: [],
    }],
    logistics: {
      accommodations: [],
      reservations: [],
      documents: [
        { id: "passport", title: "Passport reminder", type: "passport", status: "confirmed", storageLocation: "Carry-on" },
        { id: "insurance", title: "Insurance reminder", type: "insurance", status: "planned", storageLocation: "Offline copy" },
      ],
      checklist: [],
      emergencyNotes: ["Keep emergency contacts offline."],
    },
  };
}

test("manifest generation exposes standalone branding and standard plus maskable icons", () => {
  const value = manifest();
  assert.equal(value.display, "standalone");
  assert.equal(value.start_url, "/today");
  assert.equal(value.theme_color, "#0891b2");
  assert.ok(value.icons?.some((icon) => icon.sizes === "192x192"));
  assert.ok(value.icons?.some((icon) => icon.sizes === "512x512" && icon.purpose === "maskable"));
});

test("offline detection transitions through offline, reconnecting, and online states", () => {
  const offline = connectivityAfterEvent("online", "offline");
  assert.equal(offline, "offline");
  const reconnecting = connectivityAfterEvent(offline, "online");
  assert.equal(reconnecting, "reconnecting");
  assert.equal(connectivityAfterEvent(reconnecting, "sync-complete"), "online");
  assert.equal(connectivityAfterEvent(reconnecting, "sync-failed"), "offline");
});

test("cache names include schema and deployment versions and invalidate only old BEAST caches", () => {
  const current = createCacheNames("deploy-42");
  assert.match(current.pages, new RegExp(`${PWA_SCHEMA_VERSION}-deploy-42$`));
  assert.deepEqual(
    cachesToInvalidate(
      [current.pages, "beast-travel-pages-bt-024-old", "unrelated-cache"],
      current,
    ),
    ["beast-travel-pages-bt-024-old"],
  );
  const source = buildServiceWorkerSource("deploy-42");
  assert.match(source, /invalidateOldCaches/);
  assert.match(source, /caches\.delete/);
  assert.match(source, /cache: "no-store"/);
});

test("Travel Pack generation includes confirmations, transport, contacts, maps, and reminders", () => {
  const hotel = validHotel();
  hotel.hotel.address = "Example Street 1, Zürich";
  const pack = generateTravelPack(
    itinerary(),
    [approved(hotel), approved(validFlight()), approved(validRentalCar())],
    new Date("2030-07-10T12:00:00.000Z"),
  );

  assert.equal(pack.schemaVersion, 1);
  assert.equal(pack.currentHotel?.name, "Example Hotel");
  assert.equal(pack.confirmations.length, 3);
  assert.equal(pack.flights[0]?.flightNumber, "EA 100");
  assert.equal(pack.rentalCars[0]?.pickupLocation, "Sample Airport");
  assert.ok(pack.addresses.some((address) => address.mapHref.includes("google.com/maps")));
  assert.ok(pack.reminders.some((reminder) => reminder.title.includes("Passport")));
  assert.ok(pack.reminders.some((reminder) => reminder.title.includes("Insurance")));
  assert.deepEqual(
    SWISS_EMERGENCY_CONTACTS.map((contact) => contact.phone),
    ["112", "117", "118", "144", "145", "1414"],
  );
});

test("install availability distinguishes prompt, installed, iOS instructions, and unsupported browsers", () => {
  assert.equal(getInstallExperience({ standalone: false, installPromptAvailable: true, ios: false, serviceWorkerSupported: true }), "prompt");
  assert.equal(getInstallExperience({ standalone: true, installPromptAvailable: false, ios: false, serviceWorkerSupported: true }), "installed");
  assert.equal(getInstallExperience({ standalone: false, installPromptAvailable: false, ios: true, serviceWorkerSupported: true }), "ios-instructions");
  assert.equal(getInstallExperience({ standalone: false, installPromptAvailable: false, ios: false, serviceWorkerSupported: false }), "unsupported");
});

test("service worker registration uses root scope and bypasses the HTTP cache", async () => {
  let call: { url: string; options?: RegistrationOptions } | undefined;
  const expected = {} as ServiceWorkerRegistration;
  const serviceWorker = {
    async register(url: string, options?: RegistrationOptions) {
      call = { url, options };
      return expected;
    },
  };
  assert.equal(await registerBeastServiceWorker(serviceWorker), expected);
  assert.deepEqual(call, { url: "/sw.js", options: { scope: "/", updateViaCache: "none" } });
});

test("offline routing normalizes RSC keys and forces cached document navigation", () => {
  assert.equal(
    offlineNavigationCacheKey("https://example.test/today?foo=1&_rsc=abc#up-next"),
    "/today?foo=1",
  );
  assert.equal(shouldUseDocumentNavigation("/timeline", "https://example.test", true), true);
  assert.equal(shouldUseDocumentNavigation("https://maps.google.com", "https://example.test", true), false);
  assert.equal(shouldUseDocumentNavigation("/timeline", "https://example.test", false), false);
  assert.ok(CORE_OFFLINE_ROUTES.includes("/today"));
  assert.ok(CORE_OFFLINE_ROUTES.includes("/timeline"));
  assert.ok(CORE_OFFLINE_ROUTES.includes("/travel-pack"));
  const source = buildServiceWorkerSource("offline-test");
  assert.doesNotThrow(() => new Function(source));
  assert.match(source, /request\.mode === "navigate"/);
  assert.match(source, /imageCacheFirst/);
  assert.match(source, /travel-inbox\/preview/);
  assert.match(source, /cache\.match\(navigationKey\("\/offline"\)\)/);
});

test("sync timestamps use concise relative labels", () => {
  const now = Date.parse("2030-07-10T12:00:00.000Z");
  assert.equal(formatSyncAge(null, now), "Not synced yet");
  assert.equal(formatSyncAge(now - 20_000, now), "Updated just now");
  assert.equal(formatSyncAge(now - 120_000, now), "Updated 2 minutes ago");
  assert.equal(formatSyncAge(now - 3_600_000, now), "Updated 1 hour ago");
});
