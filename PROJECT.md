# BEAST Travel Project

BEAST Travel is the operational companion for the Richards family Switzerland
trip. The tracked itinerary remains the canonical source for authored plans;
approved reservation JSON remains private runtime data under `travel-data/`.

The principal traveler-facing routes are:

| Route | Purpose |
| --- | --- |
| `/` | Trip overview and journey navigation |
| `/today` | Timezone-aware travel-day dashboard |
| `/timeline` | Unified chronological trip view |
| `/trips/switzerland-2026/day/:day` | Authored itinerary-day detail |
| `/trips/switzerland-2026/logistics` | Reservations and operational logistics |
| `/reservations` | Approved imported reservation records |
| `/travel-inbox` | Document intake, review, and approval |

BT-024 derives timeline views at request time. It does not copy imported
reservations into tracked itinerary JSON or create another persistence format.
See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for boundaries and
[`SPRINT.md`](SPRINT.md) for current delivery status.
