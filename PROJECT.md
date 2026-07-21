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

BT-025 makes these read models installable and available offline. A native
service worker caches server-rendered route snapshots and read-only JSON, while
network-first refresh keeps reservation and itinerary data current whenever a
connection exists. The Travel Pack is generated at request time from the
canonical itinerary plus approved reservation records; it is not another
persistence format and never writes back to either source.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for cache and update
boundaries and [`SPRINT.md`](SPRINT.md) for current delivery status.
