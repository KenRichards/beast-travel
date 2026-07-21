# BEAST Travel

BEAST Travel is a data-driven travel planning application built with Next.js,
React, TypeScript, and Tailwind CSS. It presents trip itineraries, destination
details, interactive maps, reservations, and logistics from structured trip
data.

## Engineering documentation

The [engineering documentation](docs/README.md) is the repository handbook and
the reference workflow for future BEAST projects. It covers:

- [development workflow](docs/DEVELOPMENT_WORKFLOW.md);
- [coding standards](docs/CODING_STANDARDS.md);
- [architecture](docs/ARCHITECTURE.md);
- [AI-assisted delivery](docs/AI_WORKFLOW.md);
- [milestone lifecycle](docs/MILESTONE_LIFECYCLE.md);
- [validation](docs/VALIDATION.md);
- [release process](docs/RELEASE_PROCESS.md); and
- [the project roadmap](docs/ROADMAP.md).

Current product scope and delivery state are summarized in
[PROJECT.md](PROJECT.md), [BACKLOG.md](BACKLOG.md), and [SPRINT.md](SPRINT.md).

Reusable planning, implementation, review, and issue templates are available in
[`templates/`](templates/).

The local-first [Travel Data structure](travel-data/README.md) defines where
reservation documents and importer data belong without committing personal
travel data.

## Installable offline app

BEAST Travel is a Progressive Web App. In a supported Chromium browser, use the
**Install app** control in the connection banner. On iPhone or iPad, open the
site in Safari, choose **Share**, then **Add to Home Screen**. Installed and
unsupported browsers do not show an unavailable install action.

After the service worker activates, it prepares the home page, Today,
Timeline, every itinerary day, Logistics, Reservations, and the dedicated
[`/travel-pack`](http://localhost:3000/travel-pack) route for offline use. Pages
opened later, their images, application bundles, styles, and fonts are retained
for offline navigation. The Travel Pack contains current lodging,
confirmations, flights, rental-car details, addresses, map links, document
reminders, and verified Swiss emergency numbers.

The status banner announces online, offline, and reconnecting states and shows
relative sync times such as “Updated 2 minutes ago.” Reconnection refreshes
read-only itinerary, reservation, and inbox snapshots; it never calls the
reservation approval mutation or replaces client-side form state.

## Getting started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser.

The Docker Compose development service is also available on
[http://localhost:3005](http://localhost:3005):

```bash
docker compose up -d
```

Application source lives under `src/`. See the
[architecture guide](docs/ARCHITECTURE.md) before changing data or component
boundaries.

## Validation

Run the baseline static checks before opening a pull request:

```bash
git diff --check
npm test
npx tsc --noEmit
npm run lint
npm run build
```

PWA behavior requires a production build and a secure context. `localhost` is
accepted as a secure context; remote-device installation should use HTTPS. Set
`NEXT_DEPLOYMENT_ID` to an immutable release identifier during production
builds so Next.js assets and BEAST offline caches retire together:

```bash
NEXT_DEPLOYMENT_ID=<release-or-git-sha> npm run build
npm start
```

In browser developer tools, validate `/manifest.webmanifest`, the `/sw.js`
registration, offline reloads, and application storage before running a
Lighthouse PWA audit. Map links and uncached map tiles still require a network
or an installed native map application.

Use the complete [validation procedure](docs/VALIDATION.md) for runtime, route,
log, and repository-status checks.

## Framework guidance

This repository may use Next.js APIs and conventions newer than prior projects.
Read the relevant guide installed under `node_modules/next/dist/docs/` before
changing framework behavior.
