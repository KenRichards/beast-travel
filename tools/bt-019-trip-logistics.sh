#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

SERVICE="beast-travel"
TYPE_FILE="src/types/itinerary.ts"
ITINERARY_FILE="src/data/trips/switzerland-2026/itinerary.json"
DAY_PAGE='src/app/trips/[tripId]/day/[day]/page.tsx'
LOGISTICS_COMPONENT="src/components/trip/TripLogistics.tsx"
BACKUP_DIR=".backups/bt-019-$(date +%Y%m%d-%H%M%S)"

echo "=========================================="
echo " BT-019 — Trip Logistics"
echo "=========================================="

for required in \
  package.json \
  compose.yaml \
  "$TYPE_FILE" \
  "$ITINERARY_FILE" \
  "$DAY_PAGE"
do
  if [[ ! -f "$required" ]]; then
    echo "ERROR: Missing required file: $required"
    exit 1
  fi
done

mkdir -p \
  "$BACKUP_DIR/$(dirname "$TYPE_FILE")" \
  "$BACKUP_DIR/$(dirname "$ITINERARY_FILE")" \
  "$BACKUP_DIR/$(dirname "$DAY_PAGE")" \
  "$BACKUP_DIR/$(dirname "$LOGISTICS_COMPONENT")" \
  "$(dirname "$LOGISTICS_COMPONENT")"

for file in \
  "$TYPE_FILE" \
  "$ITINERARY_FILE" \
  "$DAY_PAGE" \
  "$LOGISTICS_COMPONENT"
do
  if [[ -f "$file" ]]; then
    cp "$file" "$BACKUP_DIR/$file"
  fi
done

cat >> "$TYPE_FILE" <<'EOF'

export type LogisticsStatus =
  | "not-started"
  | "researching"
  | "planned"
  | "reserved"
  | "confirmed"
  | "completed"
  | "cancelled";

export type ReservationType =
  | "flight"
  | "hotel"
  | "train"
  | "attraction"
  | "restaurant"
  | "rental-car"
  | "transfer"
  | "insurance"
  | "other";

export interface ReservationContact {
  name?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface TripReservation {
  id: string;
  type: ReservationType;
  title: string;
  provider?: string;
  status: LogisticsStatus;
  date?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  confirmationReference?: string;
  bookingUrl?: string;
  cost?: number;
  currency?: string;
  travelers?: number;
  cancellationDeadline?: string;
  contact?: ReservationContact;
  notes?: string[];
}

export interface Accommodation {
  id: string;
  name: string;
  city: string;
  status: LogisticsStatus;
  checkInDate: string;
  checkOutDate: string;
  address?: string;
  confirmationReference?: string;
  bookingUrl?: string;
  nightlyRate?: number;
  totalCost?: number;
  currency?: string;
  contact?: ReservationContact;
  amenities?: string[];
  notes?: string[];
}

export interface TravelDocument {
  id: string;
  title: string;
  type:
    | "passport"
    | "ticket"
    | "insurance"
    | "reservation"
    | "medical"
    | "emergency"
    | "other";
  status: LogisticsStatus;
  traveler?: string;
  expiresOn?: string;
  reference?: string;
  storageLocation?: string;
  notes?: string[];
}

export interface LogisticsChecklistItem {
  id: string;
  title: string;
  category:
    | "documents"
    | "money"
    | "connectivity"
    | "transportation"
    | "lodging"
    | "packing"
    | "health"
    | "home"
    | "other";
  status: LogisticsStatus;
  dueDate?: string;
  notes?: string[];
}

export interface TripLogistics {
  accommodations: Accommodation[];
  reservations: TripReservation[];
  documents: TravelDocument[];
  checklist: LogisticsChecklistItem[];
  emergencyNotes: string[];
}
EOF

python3 - <<'PY'
from pathlib import Path

path = Path("src/types/itinerary.ts")
text = path.read_text()

old = """export interface Itinerary {
  trip: TripDetails;
  days: ItineraryDay[];
}
"""

new = """export interface Itinerary {
  trip: TripDetails;
  days: ItineraryDay[];
  logistics: TripLogistics;
}
"""

if new in text:
    print("Itinerary logistics type already connected.")
elif old in text:
    path.write_text(text.replace(old, new))
    print("Connected TripLogistics to Itinerary.")
else:
    raise SystemExit(
        "Could not locate the Itinerary interface in src/types/itinerary.ts"
    )
PY

python3 - <<'PY'
import json
from pathlib import Path

path = Path("src/data/trips/switzerland-2026/itinerary.json")
data = json.loads(path.read_text())

data["logistics"] = {
    "accommodations": [
        {
            "id": "zurich-lodging",
            "name": "Zürich lodging",
            "city": "Zürich",
            "status": "planned",
            "checkInDate": "2026-07-22",
            "checkOutDate": "2026-07-24",
            "currency": "CHF",
            "amenities": [
                "Family sleeping arrangement",
                "Wi-Fi",
                "Convenient public-transit access"
            ],
            "notes": [
                "Enter the final property name, address, and confirmation reference.",
                "Confirm luggage-storage and check-in procedures before departure."
            ]
        },
        {
            "id": "grindelwald-lodging",
            "name": "Grindelwald lodging",
            "city": "Grindelwald",
            "status": "planned",
            "checkInDate": "2026-07-24",
            "checkOutDate": "2026-07-25",
            "currency": "CHF",
            "amenities": [
                "Family sleeping arrangement",
                "Wi-Fi",
                "Access to Grindelwald transportation"
            ],
            "notes": [
                "Enter the final property name, address, and confirmation reference.",
                "Confirm the route from the station or terminal to the property."
            ]
        },
        {
            "id": "final-lodging",
            "name": "Final Switzerland lodging",
            "city": "To be confirmed",
            "status": "planned",
            "checkInDate": "2026-07-25",
            "checkOutDate": "2026-07-29",
            "currency": "CHF",
            "amenities": [
                "Family sleeping arrangement",
                "Wi-Fi"
            ],
            "notes": [
                "Replace this placeholder with the final July 25–29 reservation.",
                "Record cancellation rules and check-in instructions."
            ]
        }
    ],
    "reservations": [
        {
            "id": "switzerland-arrival-flight",
            "type": "flight",
            "title": "Arrival flight to Zürich",
            "status": "planned",
            "date": "2026-07-22",
            "location": "Zürich Airport",
            "travelers": 3,
            "notes": [
                "Add airline, flight number, departure airport, and confirmation reference.",
                "Store boarding passes in the airline application and offline."
            ]
        },
        {
            "id": "switzerland-departure-flight",
            "type": "flight",
            "title": "Return flight from Switzerland",
            "status": "planned",
            "date": "2026-07-29",
            "travelers": 3,
            "notes": [
                "Add airline, flight number, airport, and confirmation reference.",
                "Confirm airport transfer timing at least one day before departure."
            ]
        },
        {
            "id": "jungfraujoch-tickets",
            "type": "attraction",
            "title": "Jungfraujoch excursion",
            "provider": "Jungfrau Railways",
            "status": "planned",
            "date": "2026-07-25",
            "location": "Grindelwald Terminal / Jungfraujoch",
            "currency": "CHF",
            "travelers": 3,
            "notes": [
                "Enter ticket and seat-reservation information after purchase.",
                "Verify weather, operating status, and departure time before travel."
            ]
        },
        {
            "id": "switzerland-rail",
            "type": "train",
            "title": "Swiss rail transportation",
            "status": "researching",
            "date": "2026-07-22",
            "travelers": 3,
            "notes": [
                "Record the selected rail pass or point-to-point ticket strategy.",
                "Keep digital tickets available offline."
            ]
        },
        {
            "id": "swisscom-connectivity",
            "type": "other",
            "title": "Swisscom tourist mobile service",
            "provider": "Swisscom",
            "status": "reserved",
            "date": "2026-07-22",
            "travelers": 1,
            "notes": [
                "Install and activate the tourist eSIM.",
                "Configure the Swisscom line for mobile data.",
                "Prevent unintended Visible international usage."
            ]
        }
    ],
    "documents": [
        {
            "id": "ken-passport",
            "title": "Ken passport",
            "type": "passport",
            "status": "confirmed",
            "traveler": "Ken",
            "storageLocation": "Physical passport and encrypted offline copy",
            "notes": [
                "Verify validity and pack in personal item."
            ]
        },
        {
            "id": "spouse-passport",
            "title": "Spouse passport",
            "type": "passport",
            "status": "confirmed",
            "traveler": "Spouse",
            "storageLocation": "Physical passport and encrypted offline copy",
            "notes": [
                "Verify validity and pack in personal item."
            ]
        },
        {
            "id": "son-passport",
            "title": "Son passport",
            "type": "passport",
            "status": "confirmed",
            "traveler": "Son",
            "storageLocation": "Physical passport and encrypted offline copy",
            "notes": [
                "Verify validity and pack in personal item."
            ]
        },
        {
            "id": "travel-insurance",
            "title": "Travel insurance documentation",
            "type": "insurance",
            "status": "not-started",
            "storageLocation": "BEAST Travel and offline device storage",
            "notes": [
                "Record insurer, policy number, emergency phone number, and coverage dates."
            ]
        },
        {
            "id": "reservation-copies",
            "title": "Offline reservation copies",
            "type": "reservation",
            "status": "not-started",
            "storageLocation": "Phones and encrypted cloud storage",
            "notes": [
                "Save lodging, flight, rail, and attraction confirmations as PDFs or screenshots."
            ]
        }
    ],
    "checklist": [
        {
            "id": "verify-passports",
            "title": "Verify all passports and expiration dates",
            "category": "documents",
            "status": "confirmed",
            "dueDate": "2026-07-20"
        },
        {
            "id": "save-confirmations",
            "title": "Save all confirmations for offline access",
            "category": "documents",
            "status": "not-started",
            "dueDate": "2026-07-21"
        },
        {
            "id": "activate-esim",
            "title": "Install and test Swisscom eSIM",
            "category": "connectivity",
            "status": "planned",
            "dueDate": "2026-07-21"
        },
        {
            "id": "visible-settings",
            "title": "Disable unintended Visible roaming usage",
            "category": "connectivity",
            "status": "not-started",
            "dueDate": "2026-07-21"
        },
        {
            "id": "download-sbb",
            "title": "Install SBB Mobile and download trip information",
            "category": "transportation",
            "status": "not-started",
            "dueDate": "2026-07-21"
        },
        {
            "id": "confirm-jungfrau",
            "title": "Confirm Jungfraujoch tickets and operating status",
            "category": "transportation",
            "status": "planned",
            "dueDate": "2026-07-24"
        },
        {
            "id": "lodging-checkin",
            "title": "Record lodging addresses and check-in instructions",
            "category": "lodging",
            "status": "not-started",
            "dueDate": "2026-07-21"
        },
        {
            "id": "notify-banks",
            "title": "Review cards, PINs, and international transaction settings",
            "category": "money",
            "status": "not-started",
            "dueDate": "2026-07-21"
        },
        {
            "id": "pack-layers",
            "title": "Pack rain protection and mountain layers",
            "category": "packing",
            "status": "not-started",
            "dueDate": "2026-07-21"
        },
        {
            "id": "medications",
            "title": "Pack medications in carry-on luggage",
            "category": "health",
            "status": "not-started",
            "dueDate": "2026-07-21"
        },
        {
            "id": "remote-access",
            "title": "Verify Tailscale remote access before departure",
            "category": "home",
            "status": "planned",
            "dueDate": "2026-07-21"
        },
        {
            "id": "home-check",
            "title": "Complete home, server, printer, and security check",
            "category": "home",
            "status": "not-started",
            "dueDate": "2026-07-21"
        }
    ],
    "emergencyNotes": [
        "Keep passports, medications, payment cards, and phones in carry-on luggage.",
        "Store emergency contacts and insurance details offline.",
        "Use 112 for the general European emergency number.",
        "At high altitude, descend and seek help if severe symptoms develop.",
        "Do not place real passport numbers or full payment-card information in the repository."
    ]
}

path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
print("Added trip logistics data.")
PY

cat > "$LOGISTICS_COMPONENT" <<'EOF'
import type {
  Accommodation,
  LogisticsChecklistItem,
  LogisticsStatus,
  TripLogistics,
  TripReservation,
} from "@/types/itinerary";

interface TripLogisticsProps {
  logistics: TripLogistics;
  dayDate?: string;
  currency?: string;
}

const STATUS_LABELS: Record<LogisticsStatus, string> = {
  "not-started": "Not started",
  researching: "Researching",
  planned: "Planned",
  reserved: "Reserved",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_CLASSES: Record<LogisticsStatus, string> = {
  "not-started": "border-white/10 bg-white/5 text-gray-300",
  researching: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  planned: "border-blue-400/20 bg-blue-400/10 text-blue-200",
  reserved: "border-violet-400/20 bg-violet-400/10 text-violet-200",
  confirmed: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  completed: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
  cancelled: "border-red-400/20 bg-red-400/10 text-red-200",
};

function StatusBadge({ status }: { status: LogisticsStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function formatDate(value?: string) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

function ReservationCard({
  reservation,
}: {
  reservation: TripReservation;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
            {reservation.type}
          </p>

          <h3 className="mt-2 text-lg font-bold">{reservation.title}</h3>

          {reservation.provider ? (
            <p className="mt-1 text-sm text-gray-500">
              {reservation.provider}
            </p>
          ) : null}
        </div>

        <StatusBadge status={reservation.status} />
      </div>

      <dl className="mt-5 space-y-2 text-sm">
        {reservation.date ? (
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Date</dt>
            <dd className="text-right text-gray-200">
              {formatDate(reservation.date)}
            </dd>
          </div>
        ) : null}

        {reservation.location ? (
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Location</dt>
            <dd className="text-right text-gray-200">
              {reservation.location}
            </dd>
          </div>
        ) : null}

        {reservation.confirmationReference ? (
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Reference</dt>
            <dd className="text-right font-mono text-gray-200">
              {reservation.confirmationReference}
            </dd>
          </div>
        ) : null}
      </dl>

      {reservation.notes?.length ? (
        <ul className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm leading-6 text-gray-400">
          {reservation.notes.map((note) => (
            <li key={note}>• {note}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function AccommodationCard({
  accommodation,
}: {
  accommodation: Accommodation;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">
            Lodging
          </p>
          <h3 className="mt-2 text-lg font-bold">
            {accommodation.name}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {accommodation.city}
          </p>
        </div>

        <StatusBadge status={accommodation.status} />
      </div>

      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">Check-in</dt>
          <dd>{formatDate(accommodation.checkInDate)}</dd>
        </div>

        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">Check-out</dt>
          <dd>{formatDate(accommodation.checkOutDate)}</dd>
        </div>

        {accommodation.address ? (
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Address</dt>
            <dd className="text-right">{accommodation.address}</dd>
          </div>
        ) : null}
      </dl>

      {accommodation.notes?.length ? (
        <ul className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm leading-6 text-gray-400">
          {accommodation.notes.map((note) => (
            <li key={note}>• {note}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function ChecklistItem({
  item,
}: {
  item: LogisticsChecklistItem;
}) {
  const complete =
    item.status === "confirmed" || item.status === "completed";

  return (
    <li className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-black ${
          complete
            ? "border-emerald-400 bg-emerald-400 text-black"
            : "border-white/20 text-gray-500"
        }`}
      >
        {complete ? "✓" : ""}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-white">{item.title}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-gray-500">
              {item.category}
              {item.dueDate ? ` · Due ${formatDate(item.dueDate)}` : ""}
            </p>
          </div>

          <StatusBadge status={item.status} />
        </div>
      </div>
    </li>
  );
}

export default function TripLogisticsPanel({
  logistics,
  dayDate,
}: TripLogisticsProps) {
  const dayReservations = dayDate
    ? logistics.reservations.filter(
        (reservation) => reservation.date === dayDate,
      )
    : logistics.reservations;

  const activeAccommodation = dayDate
    ? logistics.accommodations.filter(
        (accommodation) =>
          dayDate >= accommodation.checkInDate &&
          dayDate < accommodation.checkOutDate,
      )
    : logistics.accommodations;

  const completedChecklist = logistics.checklist.filter(
    (item) =>
      item.status === "confirmed" || item.status === "completed",
  ).length;

  const checklistPercent = logistics.checklist.length
    ? Math.round(
        (completedChecklist / logistics.checklist.length) * 100,
      )
    : 0;

  return (
    <section className="border-t border-white/10 bg-neutral-950">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-violet-300">
          Trip operations
        </p>

        <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
          Reservations and logistics
        </h2>

        <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-400">
          Lodging, transportation, tickets, documents, and departure
          tasks in one operational view.
        </p>

        <div className="mt-12 grid gap-10 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-12">
            <div>
              <div className="flex items-end justify-between gap-4">
                <h3 className="text-2xl font-bold">
                  {dayDate ? "Relevant reservations" : "Reservations"}
                </h3>

                <span className="text-sm text-gray-500">
                  {dayReservations.length} item
                  {dayReservations.length === 1 ? "" : "s"}
                </span>
              </div>

              {dayReservations.length ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {dayReservations.map((reservation) => (
                    <ReservationCard
                      key={reservation.id}
                      reservation={reservation}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center text-gray-400">
                  No date-specific reservation has been entered for this
                  day.
                </div>
              )}
            </div>

            <div>
              <h3 className="text-2xl font-bold">Lodging</h3>

              {activeAccommodation.length ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {activeAccommodation.map((accommodation) => (
                    <AccommodationCard
                      key={accommodation.id}
                      accommodation={accommodation}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center text-gray-400">
                  No lodging is assigned to this date yet.
                </div>
              )}
            </div>
          </div>

          <aside>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-bold">
                  Departure readiness
                </h3>

                <span className="text-2xl font-black text-emerald-300">
                  {checklistPercent}%
                </span>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${checklistPercent}%` }}
                />
              </div>

              <p className="mt-3 text-sm text-gray-500">
                {completedChecklist} of {logistics.checklist.length} tasks
                confirmed or completed
              </p>

              <ul className="mt-7 space-y-3">
                {logistics.checklist.map((item) => (
                  <ChecklistItem key={item.id} item={item} />
                ))}
              </ul>
            </div>

            <div className="mt-6 rounded-3xl border border-red-400/20 bg-red-400/10 p-7">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-200">
                Emergency notes
              </p>

              <ul className="mt-5 space-y-3 text-sm leading-6 text-red-50/80">
                {logistics.emergencyNotes.map((note) => (
                  <li key={note}>• {note}</li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
EOF

python3 - <<'PY'
from pathlib import Path

path = Path("src/app/trips/[tripId]/day/[day]/page.tsx")
text = path.read_text()

import_line = (
    'import TripLogisticsPanel from '
    '"@/components/trip/TripLogistics";'
)

if import_line not in text:
    anchor = (
        'import InteractiveMap from '
        '"@/components/trip/InteractiveMap";'
    )

    if anchor not in text:
        raise SystemExit("InteractiveMap import anchor not found")

    text = text.replace(anchor, f"{anchor}\n{import_line}")

section = """
      <TripLogisticsPanel
        logistics={itinerary.logistics}
        dayDate={itineraryDay.date}
        currency={currency}
      />

"""

if "<TripLogisticsPanel" not in text:
    anchor = """      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-300">
"""

    if anchor not in text:
        raise SystemExit("Budget-section anchor not found")

    text = text.replace(anchor, section + anchor)

path.write_text(text)
print("Integrated TripLogisticsPanel into day pages.")
PY

echo
echo "Validating logistics JSON..."

python3 -m json.tool "$ITINERARY_FILE" >/dev/null

python3 - <<'PY'
import json
from pathlib import Path

data = json.loads(
    Path(
        "src/data/trips/switzerland-2026/itinerary.json"
    ).read_text()
)

logistics = data.get("logistics")

if not logistics:
    raise SystemExit("Missing logistics object")

required = {
    "accommodations",
    "reservations",
    "documents",
    "checklist",
    "emergencyNotes",
}

missing = required - set(logistics)

if missing:
    raise SystemExit(
        f"Logistics object missing fields: {sorted(missing)}"
    )

valid_statuses = {
    "not-started",
    "researching",
    "planned",
    "reserved",
    "confirmed",
    "completed",
    "cancelled",
}

ids = set()

for collection_name in (
    "accommodations",
    "reservations",
    "documents",
    "checklist",
):
    collection = logistics[collection_name]

    if not collection:
        raise SystemExit(f"{collection_name} must not be empty")

    for item in collection:
        item_id = item["id"]

        if item_id in ids:
            raise SystemExit(f"Duplicate logistics id: {item_id}")

        ids.add(item_id)

        if item["status"] not in valid_statuses:
            raise SystemExit(
                f"Invalid status on {item_id}: {item['status']}"
            )

for stay in logistics["accommodations"]:
    if stay["checkOutDate"] <= stay["checkInDate"]:
        raise SystemExit(
            f"Invalid accommodation dates: {stay['id']}"
        )

print(
    "Logistics validation passed: "
    f"{len(logistics['accommodations'])} accommodations, "
    f"{len(logistics['reservations'])} reservations, "
    f"{len(logistics['documents'])} documents, "
    f"{len(logistics['checklist'])} checklist items."
)
PY

echo
echo "Checking TypeScript..."
docker compose exec -T "$SERVICE" npx tsc --noEmit

echo
echo "Running production build..."
docker compose exec -T "$SERVICE" npm run build

echo
echo "Restarting development runtime..."
docker compose down
rm -rf .next
docker compose up -d --force-recreate

echo
echo "Waiting for application..."

READY=0

for attempt in $(seq 1 40); do
  CODE="$(
    curl -sS -o /dev/null -w '%{http_code}' \
      http://127.0.0.1:3005/trips/switzerland-2026/day/1 \
      2>/dev/null || true
  )"

  if [[ "$CODE" == "200" ]]; then
    READY=1
    echo "Application ready."
    break
  fi

  printf '.'
  sleep 2
done

echo

if [[ "$READY" -ne 1 ]]; then
  echo "ERROR: Application did not become ready."
  docker compose logs --tail=200 "$SERVICE"
  exit 1
fi

echo
echo "Checking itinerary routes..."

FAILED=0

for day in 1 2 3 4; do
  URL="http://127.0.0.1:3005/trips/switzerland-2026/day/${day}"
  CODE="$(curl -sS -o /dev/null -w '%{http_code}' "$URL" || true)"

  echo "Day ${day}: HTTP ${CODE}"

  if [[ "$CODE" != "200" ]]; then
    FAILED=1
  fi
done

echo
echo "Checking rendered logistics content..."

PAGE_CONTENT="$(
  curl -sS \
    http://127.0.0.1:3005/trips/switzerland-2026/day/1
)"

for expected in \
  "Reservations and logistics" \
  "Departure readiness" \
  "Emergency notes"
do
  if grep -q "$expected" <<<"$PAGE_CONTENT"; then
    echo "Found: $expected"
  else
    echo "ERROR: Missing rendered content: $expected"
    FAILED=1
  fi
done

echo
echo "Checking recent errors..."

if docker compose logs --since=3m "$SERVICE" 2>&1 |
  grep -E \
    'Module not found|TypeError|ReferenceError|SyntaxError|window is not defined|⨯'
then
  echo
  echo "ERROR: Recent application errors detected."
  exit 1
else
  echo "No recent application errors."
fi

if [[ "$FAILED" -ne 0 ]]; then
  echo "ERROR: BT-019 validation failed."
  exit 1
fi

echo
echo "BT-019 installed successfully."
echo "Backup: $BACKUP_DIR"
echo
echo "Review:"
echo "  http://192.168.86.61:3005/trips/switzerland-2026/day/1"
echo "  http://192.168.86.61:3005/trips/switzerland-2026/day/4"
