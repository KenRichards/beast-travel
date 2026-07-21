import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

import TripNavigation from "@/components/trip/TripNavigation";
import { loadApprovedReservations } from "@/lib/import/persistence/reservations";
import { getItinerary } from "@/lib/itinerary";
import { generateTravelPack } from "@/lib/travel-pack";

export const metadata: Metadata = {
  title: "Offline Travel Pack | BEAST Travel",
  description: "Offline confirmations, lodging, flights, rental car, contacts, and Swiss emergency information.",
};

function displayDateTime(value: string | null) {
  if (!value) return "Not provided";
  const [date, time] = value.split("T");
  return time ? `${date} · ${time}` : date;
}

export default async function TravelPackPage() {
  await connection();
  const itinerary = getItinerary();
  const loaded = await loadApprovedReservations();
  const pack = generateTravelPack(itinerary, loaded.reservations);
  const hotel = pack.currentHotel;

  return (
    <main className="min-h-screen bg-neutral-950 text-white print:bg-white print:text-black">
      <header className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(244,63,94,0.13),_transparent_34%)] print:bg-none">
        <div className="mx-auto max-w-6xl px-5 pb-14 pt-24 sm:px-8 sm:pb-20">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between print:hidden">
            <Link href="/" className="text-sm font-black tracking-[0.3em] text-cyan-300">BEAST TRAVEL</Link>
            <TripNavigation compact />
          </div>
          <p className="mt-16 text-xs font-black uppercase tracking-[0.28em] text-cyan-300 print:mt-0 print:text-black">Always available · Switzerland</p>
          <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-7xl">Offline Travel Pack</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-300 print:text-black">
            The essentials for lodging, confirmations, transportation, addresses, and emergencies—saved on this device after your first online visit.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 text-xs font-bold text-neutral-300 print:text-black">
            <span className="rounded-full border border-white/15 px-4 py-2 print:border-black">{pack.confirmations.length} confirmations</span>
            <span className="rounded-full border border-white/15 px-4 py-2 print:border-black">Generated {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(pack.generatedAt))}</span>
            <a href="/api/offline/travel-pack" className="rounded-full border border-cyan-300/30 px-4 py-2 text-cyan-200 print:hidden" download="beast-travel-pack.json">Open pack JSON</a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-12 px-5 py-12 sm:px-8 sm:py-16">
        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]" aria-labelledby="hotel-heading">
          <div className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/[0.07] p-7 sm:p-9 print:border-black print:bg-white">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300 print:text-black">Current or next stay</p>
            <h2 id="hotel-heading" className="mt-4 text-3xl font-black">{hotel?.name ?? "No hotel recorded"}</h2>
            {hotel ? (
              <>
                <p className="mt-3 text-neutral-300 print:text-black">{hotel.address ?? hotel.city}</p>
                <p className="mt-2 text-sm text-neutral-400 print:text-black">Check in {hotel.checkInDate} · Check out {hotel.checkOutDate}</p>
                {hotel.confirmationReference ? (
                  <div className="mt-6 rounded-2xl bg-black/25 p-4 print:border print:border-black print:bg-white">
                    <p className="text-xs uppercase tracking-wider text-neutral-400 print:text-black">Confirmation</p>
                    <p className="mt-1 break-all font-mono text-xl font-black">{hotel.confirmationReference}</p>
                  </div>
                ) : null}
                <div className="mt-6 flex flex-wrap gap-3 print:hidden">
                  {hotel.address ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.address)}`} target="_blank" rel="noreferrer" className="rounded-full bg-cyan-300 px-5 py-3 font-bold text-neutral-950">Open map</a> : null}
                  {hotel.reservationDetailHref ? <Link href={hotel.reservationDetailHref} className="rounded-full border border-white/15 px-5 py-3 font-bold">Reservation details</Link> : null}
                </div>
              </>
            ) : <p className="mt-4 text-neutral-400">Add or approve a lodging reservation before departure.</p>}
          </div>

          <div className="rounded-[2rem] border border-rose-300/20 bg-rose-300/[0.06] p-7 sm:p-9 print:border-black print:bg-white" aria-labelledby="emergency-heading">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-300 print:text-black">Switzerland</p>
            <h2 id="emergency-heading" className="mt-4 text-3xl font-black">Emergency numbers</h2>
            <ul className="mt-6 grid grid-cols-2 gap-3">
              {pack.contacts.filter((contact) => contact.emergency).map((contact) => (
                <li key={contact.id} className="rounded-2xl bg-black/25 p-4 print:border print:border-black print:bg-white">
                  <p className="text-xs text-neutral-400 print:text-black">{contact.label}</p>
                  <a href={`tel:${contact.phone}`} className="mt-1 block font-mono text-2xl font-black text-rose-100 print:text-black" aria-label={`Call ${contact.label} at ${contact.phone}`}>{contact.phone}</a>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-6 text-neutral-400 print:text-black">Call 112 when you are unsure which service you need. Emergency calling still requires a mobile or telephone connection.</p>
          </div>
        </section>

        <section aria-labelledby="lodging-plan-heading">
          <SectionHeading eyebrow="Lodging transitions" title="Where you sleep each night" id="lodging-plan-heading" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {pack.lodgings.map((lodging) => (
              <article key={lodging.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 print:border-black print:bg-white">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300 print:text-black">Confirmed stay</p>
                <h3 className="mt-2 text-xl font-black">{lodging.name}</h3>
                <p className="mt-2 text-sm text-neutral-300 print:text-black">{lodging.checkInDate} → {lodging.checkOutDate}</p>
                <p className="mt-2 text-sm text-neutral-400 print:text-black">{lodging.address ?? lodging.city}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="itinerary-heading">
          <SectionHeading eyebrow="July 22–29" title="Day-by-day operating plan" id="itinerary-heading" />
          <ol className="mt-6 grid gap-4 md:grid-cols-2">
            {pack.itineraryDays.map((day) => (
              <li key={day.day} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 print:border-black print:bg-white">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300 print:text-black">Day {day.day} · {day.date}</p>
                <h3 className="mt-2 text-xl font-black">{day.title}</h3>
                <p className="mt-3 text-sm text-neutral-300 print:text-black">{day.startLocation} → {day.endLocation}</p>
                <p className="mt-3 text-sm leading-6 text-neutral-400 print:text-black"><strong>Fallback:</strong> {day.fallbackPlan}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="unresolved-heading">
          <SectionHeading eyebrow="Act before departure" title="Needs confirmation" id="unresolved-heading" />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {pack.unresolvedFields.map((item) => (
              <article key={item.field} className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.06] p-6 print:border-black print:bg-white">
                <p className="text-xs font-black uppercase tracking-wider text-amber-200 print:text-black">{item.status}</p>
                <h3 className="mt-2 font-black">{item.field}</h3>
                <p className="mt-3 text-sm leading-6 text-neutral-400 print:text-black">{item.action}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="confirmation-heading">
          <SectionHeading eyebrow="Keep these ready" title="Reservation confirmations" id="confirmation-heading" />
          {pack.confirmations.length ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {pack.confirmations.map((confirmation) => (
                <article key={confirmation.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 print:border-black print:bg-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300 print:text-black">{confirmation.type}</p>
                      <h3 className="mt-2 text-xl font-black">{confirmation.provider ?? "Provider not recorded"}</h3>
                    </div>
                    <Link href={confirmation.detailHref} className="text-sm font-bold text-cyan-200 print:hidden">Open →</Link>
                  </div>
                  <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                    <PackDetail label="Confirmation" value={confirmation.confirmationNumber} mono />
                    <PackDetail label="Dates" value={confirmation.dateSummary} />
                    <PackDetail label="Location" value={confirmation.locationSummary} />
                    <PackDetail label="Contact / notes" value={confirmation.contact} />
                  </dl>
                </article>
              ))}
            </div>
          ) : <EmptyState>No approved confirmations are available yet.</EmptyState>}
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <div aria-labelledby="flight-heading">
            <SectionHeading eyebrow="Air travel" title="Flight information" id="flight-heading" />
            <div className="mt-6 space-y-4">
              {pack.flights.length ? pack.flights.map((flight, index) => (
                <article key={`${flight.reservationId}-${index}`} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 print:border-black print:bg-white">
                  <div className="flex items-start justify-between gap-4">
                    <div><p className="text-sm text-neutral-400 print:text-black">{flight.airline ?? "Airline"}</p><h3 className="mt-1 text-2xl font-black">{flight.route || "Route not provided"}</h3></div>
                    <span className="font-mono font-black text-cyan-200 print:text-black">{flight.flightNumber ?? "—"}</span>
                  </div>
                  <dl className="mt-5 grid gap-4 sm:grid-cols-2"><PackDetail label="Departs" value={displayDateTime(flight.departure)} /><PackDetail label="Arrives" value={displayDateTime(flight.arrival)} /><PackDetail label="Booking reference" value={flight.confirmationNumber} mono /></dl>
                </article>
              )) : <EmptyState>No approved flight is available.</EmptyState>}
            </div>
          </div>

          <div aria-labelledby="car-heading">
            <SectionHeading eyebrow="Ground transportation" title="Rental car" id="car-heading" />
            <div className="mt-6 space-y-4">
              {pack.rentalCars.length ? pack.rentalCars.map((car) => (
                <article key={car.reservationId} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 print:border-black print:bg-white">
                  <h3 className="text-2xl font-black">{car.provider ?? "Rental provider"}</h3>
                  <dl className="mt-5 grid gap-4 sm:grid-cols-2"><PackDetail label="Pick up" value={`${car.pickupLocation ?? "Location not provided"} · ${displayDateTime(car.pickup)}`} /><PackDetail label="Drop off" value={`${car.dropoffLocation ?? "Location not provided"} · ${displayDateTime(car.dropoff)}`} /><PackDetail label="Vehicle" value={car.vehicle} /><PackDetail label="Confirmation" value={car.confirmationNumber} mono /></dl>
                </article>
              )) : <EmptyState>No approved rental car is available.</EmptyState>}
            </div>
          </div>
        </section>

        <section aria-labelledby="reminder-heading">
          <SectionHeading eyebrow="Before leaving" title="Passport and insurance reminders" id="reminder-heading" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pack.reminders.map((reminder) => (
              <article key={reminder.title} className="rounded-3xl border border-amber-300/15 bg-amber-300/[0.05] p-5 print:border-black print:bg-white">
                <span className="text-xs font-black uppercase tracking-wider text-amber-200 print:text-black">{reminder.status.replaceAll("-", " ")}</span>
                <h3 className="mt-3 font-black">{reminder.title}</h3>
                <p className="mt-3 text-sm leading-6 text-neutral-400 print:text-black">{reminder.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="address-heading">
          <SectionHeading eyebrow="Find your way" title="Addresses and map links" id="address-heading" />
          <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 print:border-black">
            <ul className="divide-y divide-white/10 print:divide-black">
              {pack.addresses.map((address) => (
                <li key={address.id} className="flex flex-col gap-3 bg-white/[0.025] px-5 py-4 sm:flex-row sm:items-center sm:justify-between print:bg-white">
                  <div><p className="font-bold">{address.label}</p><address className="mt-1 text-sm not-italic text-neutral-400 print:text-black">{address.address}</address></div>
                  <a href={address.mapHref} target="_blank" rel="noreferrer" className="shrink-0 text-sm font-bold text-cyan-200 print:hidden">Open map ↗</a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 sm:p-9 print:border-black print:bg-white" aria-labelledby="notes-heading">
          <h2 id="notes-heading" className="text-2xl font-black">Swiss emergency information</h2>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-neutral-300 print:text-black">
            {pack.swissEmergencyNotes.map((note) => <li key={note} className="flex gap-3"><span aria-hidden="true" className="text-cyan-300 print:text-black">•</span><span>{note}</span></li>)}
          </ul>
          {loaded.malformedFiles.length ? <p className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] p-4 text-sm text-amber-100 print:text-black" role="status">Some malformed reservation records were skipped. Valid information remains available.</p> : null}
        </section>
      </div>
    </main>
  );
}

function SectionHeading({ eyebrow, title, id }: { eyebrow: string; title: string; id: string }) {
  return <div><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300 print:text-black">{eyebrow}</p><h2 id={id} className="mt-3 text-3xl font-black sm:text-4xl">{title}</h2></div>;
}

function PackDetail({ label, value, mono = false }: { label: string; value: string | null; mono?: boolean }) {
  return <div><dt className="text-xs font-bold uppercase tracking-wider text-neutral-500 print:text-black">{label}</dt><dd className={`mt-1 break-words text-sm font-semibold ${mono ? "font-mono text-cyan-100 print:text-black" : ""}`}>{value || "Not provided"}</dd></div>;
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="mt-6 rounded-3xl border border-dashed border-white/15 p-7 text-neutral-400 print:border-black print:text-black">{children}</p>;
}
