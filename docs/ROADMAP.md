# Roadmap

This roadmap captures delivered and upcoming work after the BT-019 travel
logistics milestone. Scope and order may change through milestone planning;
identifiers remain stable for traceability.

## Milestones

| Milestone | Title | Intended outcome | Status |
| --- | --- | --- | --- |
| BT-020 | Travel Inbox Foundation | Establish private document intake and safe filesystem boundaries. | Complete |
| BT-021 | Reservation Import Pipeline | Add normalized reservation contracts, provider parsing, validation, and review. | Complete |
| BT-022 | Reservation Document Analysis | Analyze uploaded documents and prepare reviewable extracted data. | Complete |
| BT-023 | Real Reservation Extraction | Add OCR, approval persistence, canonical detail routes, and imported logistics. | Complete |
| BT-024 | Unified Timeline and Today | Turn itinerary and imported records into a Zurich-time operational dashboard. | Implemented on feature branch |
| BT-025 | PWA and Offline Travel Pack | Make essential trip pages, confirmations, and safety information installable and resilient without connectivity. | Implemented on feature branch |
| BT-026 | Trip Data Audit and Complete Switzerland Itinerary | Reconcile every booked fact and deliver a realistic eight-day operational plan with automated data-quality checks. | Implemented on feature branch |

## Planning notes

### BT-020 through BT-023 — Reservation import foundation

Delivered the Travel Inbox, normalized extraction pipeline, native-text and
local-OCR analysis, human review, approval persistence, canonical reservation
details, and runtime logistics projection.

### BT-024 — Unified Timeline and Today

Derives a normalized timeline from itinerary and approved reservation data,
groups it by Zurich calendar day, and exposes an operational Today dashboard
for before, during, and after the trip. Imported data remains in its existing
private persistence boundary.

### BT-025 — PWA and Offline Travel Pack

Adds a native web manifest and service worker, standalone installation UX,
accessible connectivity and synchronization state, and a generated Travel Pack.
The service worker precaches the core trip routes and canonical read-only JSON,
stores viewed pages and images, and refreshes data with a network-first policy.
Deployment-versioned cache names prevent old route snapshots and assets from
being mixed with a new release.

### BT-026 — Trip data completion and reconciliation

Replaces the four-day placeholder journey with the complete July 22–29 plan:
direct airport-to-Grindelwald transfer, Jungfraujoch, Lauterbrunnen/Mürren,
Lucerne-to-Au transfer, Rhine Falls/Stein am Rhein, Zürich, Lake Zürich, and
departure. Approved source documents were audited to recover the missing
feeder flight and travelers, correct overnight and split-calendar OCR dates,
identify Budget as the supplier, and verify both stays.

Every itinerary item states whether it is confirmed, authored, recommended,
weather dependent, unresolved, or optional. The reusable validator prevents
day/date gaps, lodging gaps or overlaps, broken references, chronology
failures, unsupported confirmation claims, and manual/imported
contradictions. The reconciliation matrix is the durable audit trail for
source-backed exceptions without committing private documents.

## Future milestones

Add approved work below using [the milestone template](../templates/milestone.md).
Do not assign an identifier until the owner accepts the problem statement and
its place in the sequence.

| Milestone | Title | Intended outcome | Dependencies | Status |
| --- | --- | --- | --- | --- |
| TBD | AI Travel Assistant | Add a bounded assistant grounded in trip data with privacy, safety, provider, and cost controls. | Stable offline and reservation read models | Idea |
| TBD | _Reserved for future work_ | _Describe the observable outcome._ | _List prerequisites._ | Idea |
| TBD | _Reserved for future work_ | _Describe the observable outcome._ | _List prerequisites._ | Idea |
| TBD | _Reserved for future work_ | _Describe the observable outcome._ | _List prerequisites._ | Idea |

## Roadmap maintenance

- Review the roadmap after every release and material architecture decision.
- Move milestone detail into a dedicated milestone record when planning begins.
- Record dependencies and risks; do not use roadmap order as the only
  dependency signal.
- Mark completed work with its release or merge reference instead of deleting
  history.
- Capture newly discovered work separately rather than silently expanding an
  active milestone.
