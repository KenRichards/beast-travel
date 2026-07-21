# Current Sprint

## BT-025 — Progressive Web App and Offline Travel Pack

Status: implemented on `feature/bt-025-pwa-offline`; awaiting review and
explicit merge decision.

Delivered scope:

- Next.js-native manifest metadata, standard and maskable brand icons,
  standalone display metadata, install controls, and iOS instructions;
- a deployment-versioned service worker with network-first pages/data,
  cache-first immutable assets and viewed images, offline document navigation,
  and old-cache retirement;
- an accessible online/offline/reconnecting banner, safe read-only reconnect
  refresh, and human-readable last-sync timestamps;
- `/travel-pack` and read-only offline JSON endpoints generated from canonical
  itinerary and approved reservation sources;
- offline coverage for Today, Timeline, itinerary days, Logistics,
  Reservations, reservation details, static assets, fonts, and viewed images;
- focused tests for the manifest, state detection, installation, worker
  registration, versioning, invalidation, routing, Travel Pack, and timestamps.

Definition of done requires the validation commands and browser checks recorded
in the final BT-025 handoff. This branch must not be merged automatically.
