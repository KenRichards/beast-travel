# Architecture

BEAST Travel is a data-driven travel planning application built with Next.js
16, React 19, TypeScript, and Tailwind CSS. The current implementation reads a
versioned itinerary from repository JSON and renders a landing page, itinerary
day routes, logistics panels, a unified timeline, a timezone-aware Today
dashboard, and interactive Leaflet maps. Approved reservation records are read
from a separate private runtime-data boundary.

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
- **Offline support:** create a deliberate cache manifest and synchronization
  model instead of assuming every server-rendered route is offline capable.
- **Observability:** add structured logs, request correlation, health checks,
  error reporting, and provider latency metrics.
- **Testing:** add unit tests for domain helpers, component tests for states and
  accessibility, and end-to-end coverage for critical trip flows.

Record major choices that change these boundaries as architecture decision
records so future BEAST projects can understand both the decision and its
context.
