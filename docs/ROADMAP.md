# Roadmap

This roadmap captures the planned sequence after the BT-019 travel logistics
work. Scope and order may change through milestone planning; identifiers remain
stable for traceability.

## Upcoming milestones

| Milestone | Title | Intended outcome | Status |
| --- | --- | --- | --- |
| BT-020 | Weather | Add destination and itinerary-day forecasts with provider failure, freshness, units, and time-zone behavior defined. | Planned |
| BT-021 | Reservation Import | Import reservation details into the trip logistics model through a validated, privacy-conscious workflow. | Planned |
| BT-022 | Offline Travel Pack | Make essential itinerary, reservation, contact, and map-reference information available with unreliable connectivity. | Planned |
| BT-023 | Maps | Expand mapping beyond the current marker view with route-aware navigation and provider abstractions. | Planned |
| BT-024 | Expense Tracking | Record, categorize, total, and reconcile trip expenses across supported currencies and travelers. | Planned |
| BT-025 | AI Travel Assistant | Add a bounded assistant grounded in trip data with privacy, safety, provider, and cost controls. | Planned |

## Planning notes

### BT-020 — Weather

Define provider ownership, server-only credentials, forecast caching and
freshness, unit preferences, time zones, attribution, unavailable states, and
rate-limit behavior before implementation.

### BT-021 — Reservation Import

Define supported source formats, duplicate handling, runtime schema validation,
user confirmation, sensitive-data boundaries, retention, and redaction. Avoid
placing real traveler documents in repository fixtures.

### BT-022 — Offline Travel Pack

Identify the minimum safe offline dataset, update strategy, conflict behavior,
storage limits, device privacy, stale-data indicators, and how a traveler
removes cached information.

### BT-023 — Maps

Define whether the milestone covers routing, downloadable tiles, directions,
transit, geolocation, or only richer trip visualization. Preserve provider
attribution and isolate vendor-specific APIs behind typed adapters.

### BT-024 — Expense Tracking

Define ownership, split rules, base and transaction currencies, exchange-rate
sources, rounding, receipt privacy, edit history, export, and offline behavior.

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
