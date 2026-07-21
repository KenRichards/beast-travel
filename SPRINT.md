# Current Sprint

## BT-026 — Trip Data Audit and Complete Switzerland Itinerary

Status: implemented on `feature/bt-026-trip-data-completion`; awaiting review
and an explicit merge decision.

Delivered scope:

- source-document audit of the approved flight, Budget rental, Grindelwald
  cottage, and No1 Art B&B records;
- a complete July 22–29 plan with direct Day 1 transfer to Grindelwald,
  corrected July 25 lodging transition to Au, operational detail, budgets, and
  daily fallback plans;
- explicit confirmed/recommended/weather-dependent/needs-confirmation/optional
  semantics in data and rendered day pages;
- corrected importer handling for split Booking.com calendar dates, Air Canada
  overnight markers and traveler extraction, and Booking.com rental supplier,
  driver, and excluded-coverage text;
- an actionable trip-data validator covering dates, days, lodging, chronology,
  references, provenance, traveler/trip consistency, and contradictions;
- corrected Timeline, Today, Logistics, reservation detail, Travel Pack, and
  offline itinerary projections.

Known action before travel: move the confirmed noon July 29 Budget return
earlier because AC 881 departs at 13:25. The earlier time remains explicitly
unconfirmed.

Definition of done includes Docker tests, trip-data validation, TypeScript,
lint, production build, rendered route inspection, offline JSON inspection,
clean repository state, and the BT-026 commit. This branch must not be merged
automatically.
