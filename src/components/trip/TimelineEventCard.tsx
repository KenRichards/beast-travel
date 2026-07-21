import Link from "next/link";

import { formatClockTime, formatTripDate } from "@/lib/trip-time";
import type { TimelineEvent, TimelineEventKind } from "@/types/timeline";

const EVENT_APPEARANCE: Record<
  TimelineEventKind,
  { icon: string; label: string; classes: string }
> = {
  flight: {
    icon: "✈",
    label: "Flight",
    classes: "border-sky-300/25 bg-sky-300/[0.07] text-sky-200",
  },
  "accommodation-check-in": {
    icon: "⌂",
    label: "Check-in",
    classes: "border-violet-300/25 bg-violet-300/[0.07] text-violet-200",
  },
  "accommodation-check-out": {
    icon: "⌂",
    label: "Check-out",
    classes: "border-fuchsia-300/25 bg-fuchsia-300/[0.07] text-fuchsia-200",
  },
  "rental-car-pickup": {
    icon: "◆",
    label: "Car pickup",
    classes: "border-amber-300/25 bg-amber-300/[0.07] text-amber-200",
  },
  "rental-car-return": {
    icon: "◆",
    label: "Car return",
    classes: "border-orange-300/25 bg-orange-300/[0.07] text-orange-200",
  },
  activity: {
    icon: "●",
    label: "Activity",
    classes: "border-emerald-300/20 bg-emerald-300/[0.05] text-emerald-200",
  },
  transportation: {
    icon: "→",
    label: "Transportation",
    classes: "border-cyan-300/20 bg-cyan-300/[0.05] text-cyan-200",
  },
  reservation: {
    icon: "◇",
    label: "Reservation",
    classes: "border-white/15 bg-white/[0.04] text-neutral-200",
  },
};

function eventTime(event: TimelineEvent) {
  if (!event.time) return event.timeLabel;
  const start = formatClockTime(event.time);
  if (!event.endTime) return start;
  const end = formatClockTime(event.endTime);
  const endDate =
    event.endDate && event.endDate !== event.date
      ? ` · ${formatTripDate(event.endDate, { month: "short", day: "numeric" })}`
      : "";
  return `${start}–${end}${endDate}`;
}

export default function TimelineEventCard({
  event,
  featured = false,
}: {
  event: TimelineEvent;
  featured?: boolean;
}) {
  const appearance = EVENT_APPEARANCE[event.kind];
  return (
    <article
      className={`rounded-2xl border p-5 sm:p-6 ${appearance.classes} ${featured ? "ring-1 ring-cyan-200/30" : ""}`}
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-current/25 bg-black/20 text-lg font-black"
        >
          {appearance.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.16em]">
            <span>{appearance.label}</span>
            <span className="text-white/30">•</span>
            <span
              className={
                event.source === "imported"
                  ? "rounded-full bg-cyan-300/15 px-2 py-1 text-cyan-100"
                  : "text-white/55"
              }
            >
              {event.source === "imported"
                ? "Imported"
                : event.source === "manual"
                  ? "Manual"
                  : "Itinerary"}
            </span>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h3 className="text-lg font-bold leading-6 text-white">
              {event.title}
            </h3>
            <span className="shrink-0 font-mono text-sm font-black text-white">
              {eventTime(event)}
            </span>
          </div>

          {event.location ? (
            <p className="mt-3 text-sm font-semibold text-white/75">
              <span aria-hidden="true">⌖</span> {event.location}
            </p>
          ) : null}
          {event.description ? (
            <p className="mt-3 text-sm leading-6 text-white/55">
              {event.description}
            </p>
          ) : null}
          {event.transport || event.provider || event.confirmationReference ? (
            <dl className="mt-4 grid gap-2 border-t border-white/10 pt-4 text-xs sm:grid-cols-2">
              {event.transport ? (
                <div>
                  <dt className="text-white/40">Transport</dt>
                  <dd className="mt-1 font-semibold text-white/80">
                    {event.transport}
                  </dd>
                </div>
              ) : null}
              {event.provider ? (
                <div>
                  <dt className="text-white/40">Provider</dt>
                  <dd className="mt-1 font-semibold text-white/80">
                    {event.provider}
                  </dd>
                </div>
              ) : null}
              {event.confirmationReference ? (
                <div>
                  <dt className="text-white/40">Confirmation</dt>
                  <dd className="mt-1 font-mono font-bold text-white">
                    {event.confirmationReference}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          <Link
            href={event.sourceLink.href}
            className="mt-4 inline-flex text-sm font-bold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white"
          >
            {event.sourceLink.label} →
          </Link>
        </div>
      </div>
    </article>
  );
}
