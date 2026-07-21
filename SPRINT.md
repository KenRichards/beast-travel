# Current Sprint

## BT-024 — Unified Trip Timeline and Today Dashboard

Status: implemented on `feature/bt-024-trip-timeline`; awaiting review and
explicit merge decision.

Delivered scope:

- normalized chronological events from itinerary, logistics, and approved
  reservation records;
- centralized `Europe/Zurich` date, time, and timezone projection utilities;
- responsive `/timeline` and `/today` routes with loading, empty, error,
  before-trip, active-trip, and completed-trip states;
- source badges and canonical reservation or itinerary links;
- deterministic domain tests for ordering, timezone rollover, Today state,
  lodging, next events, untimed items, and imported-record links.

Definition of done requires the validation commands and browser checks recorded
in the final BT-024 handoff. This branch must not be merged automatically.
