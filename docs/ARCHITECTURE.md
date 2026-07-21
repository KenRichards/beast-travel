# Architecture

BEAST Travel is a data-driven travel planning application built with Next.js
16, React 19, TypeScript, and Tailwind CSS. The current implementation reads a
versioned itinerary from repository JSON and renders a landing page, itinerary
day routes, logistics panels, a unified timeline, a timezone-aware Today
dashboard, and interactive Leaflet maps. Approved reservation records are read
from a separate private runtime-data boundary.

BT-025 adds a browser-managed offline boundary. BT-026 adds a typed trip-data
quality boundary and a source-backed reconciliation record. Neither changes
the private-document boundary: the service worker stores replaceable read
snapshots in Cache Storage, and the Travel Pack is a generated projection.

## Trip-data authority and reconciliation

Booked facts follow a strict hierarchy:

1. A human-reviewed approved reservation and its local source document.
2. A documented correction when OCR is demonstrably damaged or low confidence.
3. The tracked authored itinerary for sequencing, estimates, fallbacks, and
   recommendations.
4. Current operator guidance for access, ticketing, parking, and weather rules.

The approved JSON and source documents remain ignored private runtime data.
Tracked `itinerary.json` may repeat non-secret operational facts needed for an
offline plan, but it does not copy confirmation codes, PINs, tickets, or full
private contacts. `audit.json` records the compared field, authority, status,
finding, and unresolved action. A missing value is never silently inferred;
the data and UI use `Needs confirmation`.

Each day owns an ordered schedule, start/end location, realistic departure
window, travel estimates, parking, meals, recovery, weather sensitivity,
ticket/reservation needs, physical effort, fallback, notes, and budget
categories. Every location, schedule item, and travel segment has a provenance
label: `Confirmed reservation`, `Authored itinerary`, `Recommended`,
`Weather dependent`, `Needs confirmation`, or `Optional`.

`validateTripData()` is the reusable quality gate and
`npm run validate:trip-data` is its CLI. It emits actionable codes, paths,
messages, and remediation for missing/duplicate days, date gaps, lodging gaps
or overlaps, reversed stays or rentals, out-of-range events/flights, malformed
times, missing operational links, false confirmation claims, traveler/trip
inconsistency, orphaned reservation references, and contradictory manual and
imported projections. Tests exercise both the complete trip and deliberately
damaged fixtures.

To correct future itinerary data:

1. Inspect the private approved record and source evidence.
2. Reapprove or explicitly reconcile only proven OCR damage.
3. Update the tracked itinerary and `audit.json` without copying secrets.
4. Update every Timeline, Today, and Travel Pack projection affected.
5. Add a regression fixture and run the full validation suite.

The Travel Pack includes all lodging transitions, all eight itinerary-day
summaries and fallbacks, and unresolved operational actions in addition to its
reservation-backed detail. It remains a generated view.

## System context

The browser requests an App Router route. Next.js loads typed itinerary data on
the server, renders the route and its server components, and sends the result
to the browser. Small client-component islands hydrate where browser state or
APIs are required. The interactive map then loads Leaflet and map tiles in the
browser.

```text
Tracked itinerary JSON ----+
                           |
Approved reservation JSON -+--> Timeline normalization --> App Router pages
                           |                                  |
                           +--> Logistics projection          v
                                                       HTML/RSC response
                                                              |
                                                              v
                                                 Typed server components
                                                              |
                                                              v
                                                  Client-only map island
```

Offline requests add one layer in front of that flow:

```text
Browser navigation
       |
       v
Service worker -- online --> Next.js route --> canonical itinerary/reservations
       |                           |
       |                           v
       +<---- refresh HTML/JSON/cache snapshots
       |
       +-- offline --> versioned Cache Storage --> saved HTML/assets/JSON
```

There is currently no application database or authentication service.
Repository JSON is the canonical authored-trip source. Approved reservations
use schema-validated, atomic JSON persistence under `travel-data/reservations/`
and are never duplicated into tracked itinerary data. The reservation approval
route is the only current mutation boundary.

## Repository layout

```text
.
├── docs/                    Engineering handbook
├── public/                  Static images, icons, and brand assets
├── src/
│   ├── app/                 App Router layouts, pages, routes, and global CSS
│   ├── components/          Reusable presentation and feature components
│   │   └── trip/            Trip-specific maps and logistics UI
│   ├── data/trips/          Versioned trip JSON organized by stable trip ID
│   ├── lib/                 Data access, timezone, and domain transformations
│   └── types/               Shared domain and component contracts
├── templates/               Reusable engineering work templates
├── tools/                   Repository automation and milestone scripts
├── compose.yaml             Docker Compose development runtime
├── next.config.ts           Next.js configuration
├── package.json             Dependencies and developer commands
└── tsconfig.json            Strict TypeScript configuration and path aliases
```

Generated directories such as `.next/`, build output, dependency directories,
environment files, and TypeScript build metadata are ignored and must not be
committed.

## Route organization

`src/app/layout.tsx` is the root layout and `src/app/page.tsx` is the landing
page. App Router folders map to URL segments:

| Source | Route | Role |
| --- | --- | --- |
| `src/app/page.tsx` | `/` | Main trip presentation and journey overview |
| `src/app/today/page.tsx` | `/today` | Request-time dashboard for the active Zurich trip day |
| `src/app/timeline/page.tsx` | `/timeline` | Unified itinerary and reservation chronology |
| `src/app/map-test/page.tsx` | `/map-test` | Map integration test route |
| `src/app/trips/[tripId]/day/[day]/page.tsx` | `/trips/:tripId/day/:day` | A generated itinerary day view |
| `src/app/trips/[tripId]/logistics/page.tsx` | `/trips/:tripId/logistics` | Manual and imported logistics |
| `src/app/reservations/[id]/page.tsx` | `/reservations/:id` | Canonical imported reservation detail |
| `src/app/travel-pack/page.tsx` | `/travel-pack` | Generated offline operational essentials |
| `src/app/api/offline/*` | `/api/offline/*` | Read-only itinerary, reservation, inbox, and pack snapshots |
| `src/app/sw.js/route.ts` | `/sw.js` | Deployment-versioned service-worker program |

## PWA and offline architecture

`src/app/manifest.ts` generates `/manifest.webmanifest` using the Next.js 16
metadata convention. Standard 192px and 512px icons and a padded 512px maskable
icon reuse the BEAST brand mark. The root metadata declares standalone/iOS
capability, theme and background colors, viewport safe areas, and shortcuts to
Today and the Travel Pack.

`PwaShell` is the narrow client boundary for browser-only APIs. In production it
registers `/sw.js` at root scope with `updateViaCache: "none"`, captures the
Chromium install event, supplies manual Safari instructions, detects standalone
mode, and announces connection/sync state through an ARIA live region. While
offline, same-origin client links are promoted to full document navigations so
the worker can return cached HTML instead of depending on an uncached App Router
RSC transition.

The worker has four cache classes. Every name includes the BT-025 schema and
the deployment identifier:

| Cache | Strategy | Boundary |
| --- | --- | --- |
| pages | Network first, cached-document fallback | Core routes and subsequently viewed HTML pages |
| data | Network first, cached-response fallback | Read-only `/api/offline/*` JSON only |
| assets | Cache first | Versioned Next.js JS/CSS/font files and core brand assets |
| images | Cache first after first view | Same-origin images and external image responses such as viewed map tiles |

The install phase fetches the home page, Today, Timeline, all eight day pages,
Logistics, Reservations, Travel Pack, and the offline fallback. It extracts
same-origin asset references from those HTML responses so JavaScript bundles,
CSS, and fonts are ready for offline startup; declared core trip images are
cached separately. It also caches the four read-only JSON snapshots and
discovered reservation-detail routes.
Individual precache failures are isolated so one temporarily unavailable page
does not prevent worker installation.

Mutating requests, Travel Inbox preview queries, source PDFs, credentials, and
non-image cross-origin traffic are outside the cache boundary. External map
links are preserved but map applications and tiles not previously viewed still
need connectivity. Browser Cache Storage is device-local convenience storage,
not encrypted archival storage; do not add passport numbers, payment data, or
other new secrets to the Travel Pack.

### Update and synchronization flow

On an online event after disconnection, `PwaShell` changes from `offline` to
`reconnecting` and asks the active worker to refresh itinerary, reservations,
inbox metadata, Travel Pack JSON, and affected page snapshots. Successful sync
stores a timestamp in localStorage, announces `online`, and calls App Router
refresh so server-rendered data can update without a hard reload. This flow is
GET-only: it never invokes reservation approval and does not write to itinerary
or reservation persistence, so unsaved local form state is not unexpectedly
replaced.

`NEXT_DEPLOYMENT_ID` should be an immutable release or Git identifier in
production. Next.js appends it to assets and navigation metadata, while the
service worker embeds it in cache names. Activation deletes older BEAST cache
names but leaves unrelated origin caches untouched. Page/data requests remain
network first and request `no-store` during explicit sync, preventing stale
reservation snapshots from winning while connected.

### Travel Pack generation

`generateTravelPack()` receives the typed tracked itinerary, approved
reservation values, and a clock. It merges imported logistics in memory,
selects the confirmed current or next accommodation in Zurich time, and emits
confirmation, flight, rental-car, address/map, contact, reminder, emergency,
and approved-JSON views. `/travel-pack` renders that model as accessible HTML;
`/api/offline/travel-pack` makes the same model available as cached JSON.

Swiss general, police, fire, ambulance, poison, and Rega numbers are maintained
as a small reviewed safety constant. Verify them against the Swiss Federal
Office of Communications and Rega before future international trips or safety
content changes.

Route pages and layouts are Server Components unless a file explicitly defines
a client boundary. Dynamic day routes use `generateStaticParams` from the
tracked itinerary and resolve missing trips or days through `notFound()`.

## Data flow

1. `src/data/trips/<trip-id>/itinerary.json` stores trip details, days,
   locations, schedules, budgets, travel segments, reservations,
   accommodations, and checklists.
2. TypeScript contracts in `src/types/` describe the expected structure.
3. `src/lib/itinerary.ts` imports the JSON and exposes narrow read helpers such
   as `getItineraryDay`.
4. Server route components call those helpers and select the relevant domain
   data.
5. Data is passed through typed props to server or client components.
6. Components render accessible HTML and styling; `InteractiveMap` normalizes
   locations and creates Leaflet markers in the browser.

For timeline views, `src/lib/timeline.ts` projects the authored itinerary and
approved reservation read models into normalized `TimelineEvent` values.
`src/lib/trip-time.ts` owns Zurich date keys, source-timezone projection, and
formatting. Exact reservation timestamps are converted to `Europe/Zurich`
before grouping, including cross-midnight day changes. Approximate and
date-only itinerary values keep their labels and deterministic sort slots
without claiming false precision.

The Today page calls `connection()` before reading runtime reservation files or
the current time. It computes one request-time `Date` on the server and renders
server components only, avoiding browser/server timezone disagreement and
hydration-sensitive client clock logic.

Most formatting belongs at the display boundary. Shared trip-calendar
formatting and timezone projection belong in `src/lib/trip-time.ts`; components
must not implement their own current-day conversions. Domain values remain
machine readable: dates use ISO strings, currency uses a code plus numeric
amounts, and coordinates remain numbers.

The current JSON import is asserted as `Itinerary`; it is compile-time guidance,
not runtime validation. Runtime schema validation is required before remote or
user-supplied data becomes a supported input.

## Component organization

- Put reusable application-wide UI in `src/components/`.
- Put trip-domain components in `src/components/trip/`.
- Keep route orchestration, metadata, and parameter handling in `src/app/`.
- Keep domain lookups and transformations out of JSX in `src/lib/`.
- Keep shared props and domain contracts in `src/types/`.
- Colocate a component only when it is private to one route or feature and the
  colocation makes ownership clearer.

Use Server Components by default. Create the narrowest possible Client
Component when state, effects, event handlers, or browser-only dependencies are
needed. Do not move a large component tree to the client solely to support one
interactive child.

Components should receive the smallest complete typed model they need. Avoid
having presentation components import global itinerary data directly; route or
feature boundaries should select data and pass it down.

## Types and domain boundaries

`src/types/itinerary.ts` defines trip details, itinerary days, locations,
schedules, segments, maps, and budgets. `src/types/logistics.ts` defines
operational trip planning, `src/types/timeline.ts` defines normalized read
models for the Timeline and Today routes, and `src/types/map.ts` defines the
reusable mapping contract.

Rules for these contracts:

- maintain one canonical definition for each concept;
- compose related domains with type imports instead of duplicating fields;
- use literal unions for finite statuses and categories;
- keep optional fields genuinely optional in every consumer;
- treat identifier and date semantics as part of the contract;
- update fixtures, helpers, renderers, and documentation together when a type
  changes.

As external inputs are introduced, add runtime schemas near the ingestion
boundary and derive or verify TypeScript types from those schemas.

## JSON data conventions

Each trip belongs under a stable, lowercase, hyphenated identifier. A trip
directory owns its itinerary and may later own schema-valid ancillary content.
References such as `locationId` must resolve within that trip. Day numbers and
stable IDs support routes and React keys; changing them may break existing
links.

Do not store credentials, private traveler documents, payment data, or secrets
in tracked trip JSON. When sensitive reservation import is introduced, define
a separate protected persistence boundary and retention policy.

## Runtime and deployment

`compose.yaml` currently mounts the repository into a Node 22 development
container, installs dependencies, starts `next dev`, and publishes container
port 3000 as host port 3005. It is convenient for development and runtime
verification but is not a production image or immutable deployment artifact.

Next.js can run as a Node.js server or a production Docker image. Production
architecture must define an immutable build, non-root runtime, health checks,
configuration injection, observability, persistence, backup, and rollback
before deployment.

## Future expansion

The roadmap adds weather, reservation import, offline packs, maps, expenses,
and an AI assistant. Preserve these extension seams:

- **Provider adapters:** isolate weather, maps, reservation, and AI vendors
  behind typed interfaces in server-only modules.
- **Persistence:** introduce a repository or service layer before replacing
  local JSON with a database so components do not depend on storage details.
- **Runtime validation:** validate all external payloads and version imported
  formats.
- **Security:** keep provider credentials server-side; define authentication,
  authorization, encryption, and retention before storing traveler data.
- **Offline support:** extend the explicit cache manifest and synchronization
  model; never assume a new server-rendered route or mutation is offline-safe.
- **Observability:** add structured logs, request correlation, health checks,
  error reporting, and provider latency metrics.
- **Testing:** add unit tests for domain helpers, component tests for states and
  accessibility, and end-to-end coverage for critical trip flows.

Record major choices that change these boundaries as architecture decision
records so future BEAST projects can understand both the decision and its
context.
