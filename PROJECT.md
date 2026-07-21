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
| `/travel-pack` | Offline lodging, confirmations, transport, contacts, addresses, and reminders |

BT-026 completes and audits the July 22–29 itinerary. The operational route is
Zürich Airport → Grindelwald (July 22–25) → Au (July 25–29), with eight
fully populated days, explicit fallbacks, daily budgets, and provenance on
every itinerary item. The tracked reconciliation matrix records corrections
without copying private confirmation values into the repository.

The authority hierarchy is: reviewed approved reservation/source document for
booked facts; explicit source-backed OCR reconciliation; tracked authored
itinerary for the operating plan; operator guidance for recommendations.
Unknown or conflicting values remain `Needs confirmation`.

BT-025 makes these read models installable and available offline. A native
service worker caches server-rendered route snapshots and read-only JSON, while
network-first refresh keeps reservation and itinerary data current whenever a
connection exists. The Travel Pack is generated at request time from the
canonical itinerary plus approved reservation records; it is not another
persistence format and never writes back to either source.

Run `npm run validate:trip-data` after any itinerary or approved-reservation
correction. Future corrections must update the relevant source projection,
the reconciliation matrix, tests, and all generated views together.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for cache and update
boundaries and [`SPRINT.md`](SPRINT.md) for current delivery status.
