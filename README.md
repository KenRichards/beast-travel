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

Reusable planning, implementation, review, and issue templates are available in
[`templates/`](templates/).

The local-first [Travel Data structure](travel-data/README.md) defines where
reservation documents and importer data belong without committing personal
travel data.

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
npx tsc --noEmit
npm run build
```

Use the complete [validation procedure](docs/VALIDATION.md) for runtime, route,
log, and repository-status checks.

## Framework guidance

This repository may use Next.js APIs and conventions newer than prior projects.
Read the relevant guide installed under `node_modules/next/dist/docs/` before
changing framework behavior.
