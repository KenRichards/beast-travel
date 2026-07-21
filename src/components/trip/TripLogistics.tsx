import type {
  Accommodation,
  LogisticsChecklistItem,
  LogisticsStatus,
  TripLogistics,
  TripReservation,
} from "@/types/logistics";

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
