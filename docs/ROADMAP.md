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
| BT-025 | AI Travel Assistant | Add a bounded assistant grounded in trip data with privacy, safety, provider, and cost controls. | Planned |

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

### BT-025 — AI Travel Assistant

Define supported tasks and explicit non-goals, retrieval boundaries, prompt
injection defenses, sensitive-data rules, human confirmation for actions,
provider failover, cost budgets, evaluation, and auditability.

## Future milestones

Add approved work below using [the milestone template](../templates/milestone.md).
Do not assign an identifier until the owner accepts the problem statement and
its place in the sequence.

| Milestone | Title | Intended outcome | Dependencies | Status |
| --- | --- | --- | --- | --- |
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
