"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type {
  ApprovedReservation,
  FieldEvidence,
  FlightReservation,
  NormalizedReservation,
  ReservationType,
} from "@/lib/import/reservation";
import type { ValidationIssue } from "@/lib/import/validation/reservation";

interface ReservationReviewFormProps {
  reservation: NormalizedReservation | ApprovedReservation;
  initialErrors: ValidationIssue[];
  initialWarnings: ValidationIssue[];
  updating: boolean;
}

const EMPTY_EVIDENCE: FieldEvidence = {
  confidence: "not-found",
  source: "not-found",
};

function lines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function editableReservation(
  reservation: NormalizedReservation | ApprovedReservation,
): NormalizedReservation {
  return {
    ...reservation,
    status: "pending-review",
    approvedAt: null,
    createdAt: null,
    modifiedAt: null,
  } as NormalizedReservation;
}

function blankForType(
  current: NormalizedReservation,
  type: ReservationType,
): NormalizedReservation {
  const common = {
    ...current,
    type,
    confirmationNumber: current.confirmationNumber,
  };

  if (type === "hotel") {
    return {
      ...common,
      type,
      hotel: {
        propertyName: null,
        address: null,
        city: null,
        country: null,
        checkInDate: null,
        checkOutDate: null,
        checkInTime: null,
        checkOutTime: null,
        accommodationType: null,
        guestCount: null,
        bookingReference: current.confirmationNumber,
        contact: null,
      },
    };
  }
  if (type === "rental-car") {
    return {
      ...common,
      type,
      rentalCar: {
        rentalProvider: null,
        bookingPlatform: current.provider,
        pickupLocation: null,
        pickupLocalDateTime: null,
        dropoffLocation: null,
        dropoffLocalDateTime: null,
        timezone: null,
        vehicleCategory: null,
        primaryDriver: null,
        includedCoverage: [],
      },
    };
  }
  return {
    ...common,
    type,
    flight: {
      airline: current.provider,
      bookingReference: current.confirmationNumber,
      segments: [],
    },
  };
}

export default function ReservationReviewForm({
  reservation: initialReservation,
  initialErrors,
  initialWarnings,
  updating,
}: ReservationReviewFormProps) {
  const router = useRouter();
  const [reservation, setReservation] = useState(() =>
    editableReservation(initialReservation),
  );
  const [errors, setErrors] = useState(initialErrors);
  const [warnings, setWarnings] = useState(initialWarnings);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function markEdited(next: NormalizedReservation, path: string) {
    next.evidence = {
      ...next.evidence,
      [path]: { confidence: "high", source: "user-edited" },
    };
    setReservation(next);
    setErrors((current) => current.filter((issue) => issue.path !== path));
  }

  function commonField(
    path: "provider" | "confirmationNumber",
    value: string,
  ) {
    markEdited({ ...reservation, [path]: value || null }, path);
  }

  async function submitApproval(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/reservations/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(reservation),
      });
      const result = (await response.json()) as {
        id?: string;
        message?: string;
        errors?: ValidationIssue[];
        warnings?: ValidationIssue[];
      };

      setErrors(result.errors ?? []);
      setWarnings(result.warnings ?? []);
      setMessage(result.message ?? null);

      if (response.ok && result.id) {
        router.push(`/reservations/${result.id}`);
        router.refresh();
      }
    } catch {
      setMessage("Approval could not be completed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const issueFor = (path: string) => errors.find((issue) => issue.path === path);

  return (
    <form onSubmit={submitApproval} className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Editable reservation</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-400">
              Required, missing, and low-confidence fields are highlighted. No
              data is saved until you approve.
            </p>
          </div>
          {updating ? (
            <span className="rounded-full border border-violet-300/30 bg-violet-300/10 px-3 py-1 text-xs font-bold text-violet-200">
              Updating approved record
            </span>
          ) : null}
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <FieldShell
            path="type"
            label="Reservation type"
            evidence={reservation.evidence.type}
            issue={issueFor("type")}
            required
          >
            <select
              value={reservation.type}
              onChange={(event) =>
                markEdited(
                  blankForType(reservation, event.target.value as ReservationType),
                  "type",
                )
              }
              className="field-control"
            >
              <option value="flight">Flight</option>
              <option value="hotel">Hotel</option>
              <option value="rental-car">Rental car</option>
            </select>
          </FieldShell>
          <TextField
            path="provider"
            label="Provider"
            value={reservation.provider ?? ""}
            evidence={reservation.evidence.provider}
            issue={issueFor("provider")}
            onChange={(value) => commonField("provider", value)}
          />
          <TextField
            path="confirmationNumber"
            label="Confirmation number"
            value={reservation.confirmationNumber ?? ""}
            evidence={reservation.evidence.confirmationNumber}
            issue={issueFor("confirmationNumber")}
            onChange={(value) => commonField("confirmationNumber", value)}
          />
          <FieldShell
            path="travelers"
            label="Travelers (one per line)"
            evidence={reservation.evidence.travelers}
            issue={issueFor("travelers")}
          >
            <textarea
              value={reservation.travelers.join("\n")}
              rows={3}
              onChange={(event) =>
                markEdited(
                  { ...reservation, travelers: lines(event.target.value) },
                  "travelers",
                )
              }
              className="field-control"
            />
          </FieldShell>
        </div>
      </section>

      {reservation.type === "hotel" ? (
        <HotelFields
          reservation={reservation}
          issueFor={issueFor}
          update={(hotel, path) =>
            markEdited({ ...reservation, hotel }, path)
          }
        />
      ) : null}
      {reservation.type === "rental-car" ? (
        <RentalCarFields
          reservation={reservation}
          issueFor={issueFor}
          update={(rentalCar, path) =>
            markEdited({ ...reservation, rentalCar }, path)
          }
        />
      ) : null}
      {reservation.type === "flight" ? (
        <FlightFields
          reservation={reservation}
          issueFor={issueFor}
          update={(flight, path) =>
            markEdited({ ...reservation, flight }, path)
          }
        />
      ) : null}

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
        <FieldShell path="notes" label="Notes (one per line)" issue={issueFor("notes")}>
          <textarea
            value={reservation.notes.join("\n")}
            rows={4}
            onChange={(event) =>
              markEdited(
                { ...reservation, notes: lines(event.target.value) },
                "notes",
              )
            }
            className="field-control"
          />
        </FieldShell>
      </section>

      {warnings.length ? (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] p-5 text-sm text-amber-100">
          <p className="font-bold">Review warnings</p>
          <ul className="mt-2 space-y-1">
            {warnings.map((warning) => (
              <li key={`${warning.path}-${warning.message}`}>• {warning.message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {message ? (
        <p className="rounded-2xl border border-white/10 bg-white/5 p-4" aria-live="polite">
          {message}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/travel-inbox"
          className="rounded-full border border-white/15 px-6 py-3 text-center font-bold text-neutral-200 hover:bg-white/5"
        >
          Cancel without saving
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-cyan-300 px-7 py-3 font-black text-neutral-950 hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60"
        >
          {submitting
            ? "Approving…"
            : updating
              ? "Update and reapprove"
              : "Approve reservation"}
        </button>
      </div>
    </form>
  );
}

interface FieldShellProps {
  path: string;
  label: string;
  evidence?: FieldEvidence;
  issue?: ValidationIssue;
  required?: boolean;
  children: React.ReactNode;
}

function FieldShell({
  path,
  label,
  evidence = EMPTY_EVIDENCE,
  issue,
  required,
  children,
}: FieldShellProps) {
  const uncertain =
    evidence.confidence === "low" || evidence.confidence === "not-found";
  return (
    <label
      className={`block rounded-2xl border p-4 ${
        issue
          ? "border-red-300/50 bg-red-300/[0.08]"
          : uncertain
            ? "border-amber-300/35 bg-amber-300/[0.06]"
            : "border-white/10 bg-black/20"
      }`}
    >
      <span className="flex items-center justify-between gap-3 text-sm font-bold text-neutral-200">
        <span>{label}{required ? " *" : ""}</span>
        <span className="text-[10px] uppercase tracking-wider text-neutral-500">
          {evidence.confidence} · {evidence.source}
        </span>
      </span>
      <span className="mt-3 block">{children}</span>
      {issue ? (
        <span id={`${path}-error`} className="mt-2 block text-sm text-red-200">
          {issue.message}
        </span>
      ) : null}
    </label>
  );
}

interface TextFieldProps {
  path: string;
  label: string;
  value: string;
  evidence?: FieldEvidence;
  issue?: ValidationIssue;
  required?: boolean;
  type?: "text" | "date" | "time" | "datetime-local" | "number";
  onChange: (value: string) => void;
}

function TextField(props: TextFieldProps) {
  return (
    <FieldShell {...props}>
      <input
        type={props.type ?? "text"}
        value={props.value}
        required={props.required}
        aria-invalid={Boolean(props.issue)}
        aria-describedby={props.issue ? `${props.path}-error` : undefined}
        onChange={(event) => props.onChange(event.target.value)}
        className="field-control"
      />
    </FieldShell>
  );
}

type IssueLookup = (path: string) => ValidationIssue | undefined;

function HotelFields({
  reservation,
  issueFor,
  update,
}: {
  reservation: Extract<NormalizedReservation, { type: "hotel" }>;
  issueFor: IssueLookup;
  update: (hotel: typeof reservation.hotel, path: string) => void;
}) {
  const field = (name: keyof typeof reservation.hotel, value: string) =>
    update({ ...reservation.hotel, [name]: value || null }, `hotel.${name}`);
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
      <h2 className="text-2xl font-bold">Accommodation details</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <TextField path="hotel.propertyName" label="Property name" required value={reservation.hotel.propertyName ?? ""} evidence={reservation.evidence["hotel.propertyName"]} issue={issueFor("hotel.propertyName")} onChange={(value) => field("propertyName", value)} />
        <TextField path="hotel.accommodationType" label="Room or accommodation type" value={reservation.hotel.accommodationType ?? ""} evidence={reservation.evidence["hotel.accommodationType"]} issue={issueFor("hotel.accommodationType")} onChange={(value) => field("accommodationType", value)} />
        <TextField path="hotel.address" label="Address" value={reservation.hotel.address ?? ""} evidence={reservation.evidence["hotel.address"]} issue={issueFor("hotel.address")} onChange={(value) => field("address", value)} />
        <TextField path="hotel.city" label="City" value={reservation.hotel.city ?? ""} evidence={reservation.evidence["hotel.city"]} issue={issueFor("hotel.city")} onChange={(value) => field("city", value)} />
        <TextField path="hotel.country" label="Country" value={reservation.hotel.country ?? ""} evidence={reservation.evidence["hotel.country"]} issue={issueFor("hotel.country")} onChange={(value) => field("country", value)} />
        <TextField path="hotel.guestCount" label="Guest count" type="number" value={reservation.hotel.guestCount?.toString() ?? ""} evidence={reservation.evidence["hotel.guestCount"]} issue={issueFor("hotel.guestCount")} onChange={(value) => update({ ...reservation.hotel, guestCount: value ? Number(value) : null }, "hotel.guestCount")} />
        <TextField path="hotel.checkInDate" label="Check-in date" type="date" required value={reservation.hotel.checkInDate ?? ""} evidence={reservation.evidence["hotel.checkInDate"]} issue={issueFor("hotel.checkInDate")} onChange={(value) => field("checkInDate", value)} />
        <TextField path="hotel.checkOutDate" label="Check-out date" type="date" required value={reservation.hotel.checkOutDate ?? ""} evidence={reservation.evidence["hotel.checkOutDate"]} issue={issueFor("hotel.checkOutDate")} onChange={(value) => field("checkOutDate", value)} />
        <TextField path="hotel.checkInTime" label="Check-in time" type="time" value={reservation.hotel.checkInTime ?? ""} evidence={reservation.evidence["hotel.checkInTime"]} issue={issueFor("hotel.checkInTime")} onChange={(value) => field("checkInTime", value)} />
        <TextField path="hotel.checkOutTime" label="Check-out time" type="time" value={reservation.hotel.checkOutTime ?? ""} evidence={reservation.evidence["hotel.checkOutTime"]} issue={issueFor("hotel.checkOutTime")} onChange={(value) => field("checkOutTime", value)} />
        <TextField path="hotel.bookingReference" label="Booking reference" value={reservation.hotel.bookingReference ?? ""} evidence={reservation.evidence["hotel.bookingReference"]} issue={issueFor("hotel.bookingReference")} onChange={(value) => field("bookingReference", value)} />
        <TextField path="hotel.contact" label="Property contact" value={reservation.hotel.contact ?? ""} evidence={reservation.evidence["hotel.contact"]} issue={issueFor("hotel.contact")} onChange={(value) => field("contact", value)} />
      </div>
    </section>
  );
}

function RentalCarFields({ reservation, issueFor, update }: { reservation: Extract<NormalizedReservation, { type: "rental-car" }>; issueFor: IssueLookup; update: (car: typeof reservation.rentalCar, path: string) => void }) {
  const field = (name: keyof typeof reservation.rentalCar, value: string) => update({ ...reservation.rentalCar, [name]: value || null }, `rentalCar.${name}`);
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
      <h2 className="text-2xl font-bold">Rental-car details</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <TextField path="rentalCar.rentalProvider" label="Rental provider" required value={reservation.rentalCar.rentalProvider ?? ""} evidence={reservation.evidence["rentalCar.rentalProvider"]} issue={issueFor("rentalCar.rentalProvider")} onChange={(value) => field("rentalProvider", value)} />
        <TextField path="rentalCar.bookingPlatform" label="Booking platform" value={reservation.rentalCar.bookingPlatform ?? ""} evidence={reservation.evidence["rentalCar.bookingPlatform"]} issue={issueFor("rentalCar.bookingPlatform")} onChange={(value) => field("bookingPlatform", value)} />
        <TextField path="rentalCar.pickupLocation" label="Pickup location" required value={reservation.rentalCar.pickupLocation ?? ""} evidence={reservation.evidence["rentalCar.pickupLocation"]} issue={issueFor("rentalCar.pickupLocation")} onChange={(value) => field("pickupLocation", value)} />
        <TextField path="rentalCar.pickupLocalDateTime" label="Pickup local date/time" type="datetime-local" required value={reservation.rentalCar.pickupLocalDateTime ?? ""} evidence={reservation.evidence["rentalCar.pickupLocalDateTime"]} issue={issueFor("rentalCar.pickupLocalDateTime")} onChange={(value) => field("pickupLocalDateTime", value)} />
        <TextField path="rentalCar.dropoffLocation" label="Drop-off location" required value={reservation.rentalCar.dropoffLocation ?? ""} evidence={reservation.evidence["rentalCar.dropoffLocation"]} issue={issueFor("rentalCar.dropoffLocation")} onChange={(value) => field("dropoffLocation", value)} />
        <TextField path="rentalCar.dropoffLocalDateTime" label="Drop-off local date/time" type="datetime-local" required value={reservation.rentalCar.dropoffLocalDateTime ?? ""} evidence={reservation.evidence["rentalCar.dropoffLocalDateTime"]} issue={issueFor("rentalCar.dropoffLocalDateTime")} onChange={(value) => field("dropoffLocalDateTime", value)} />
        <TextField path="rentalCar.timezone" label="Timezone" value={reservation.rentalCar.timezone ?? ""} evidence={reservation.evidence["rentalCar.timezone"]} issue={issueFor("rentalCar.timezone")} onChange={(value) => field("timezone", value)} />
        <TextField path="rentalCar.vehicleCategory" label="Vehicle category" value={reservation.rentalCar.vehicleCategory ?? ""} evidence={reservation.evidence["rentalCar.vehicleCategory"]} issue={issueFor("rentalCar.vehicleCategory")} onChange={(value) => field("vehicleCategory", value)} />
        <TextField path="rentalCar.primaryDriver" label="Primary driver" value={reservation.rentalCar.primaryDriver ?? ""} evidence={reservation.evidence["rentalCar.primaryDriver"]} issue={issueFor("rentalCar.primaryDriver")} onChange={(value) => field("primaryDriver", value)} />
        <FieldShell path="rentalCar.includedCoverage" label="Included coverage or terms (one per line)" evidence={reservation.evidence["rentalCar.includedCoverage"]} issue={issueFor("rentalCar.includedCoverage")}>
          <textarea value={reservation.rentalCar.includedCoverage.join("\n")} rows={4} onChange={(event) => update({ ...reservation.rentalCar, includedCoverage: lines(event.target.value) }, "rentalCar.includedCoverage")} className="field-control" />
        </FieldShell>
      </div>
    </section>
  );
}

function FlightFields({ reservation, issueFor, update }: { reservation: FlightReservation; issueFor: IssueLookup; update: (flight: FlightReservation["flight"], path: string) => void }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Flight segments</h2>
        <button type="button" onClick={() => update({ ...reservation.flight, segments: [...reservation.flight.segments, { id: `segment-${reservation.flight.segments.length + 1}`, airline: reservation.flight.airline, flightNumber: null, departureAirport: null, arrivalAirport: null, departureLocalDateTime: null, arrivalLocalDateTime: null, departureTimezone: null, arrivalTimezone: null, cabinClass: null, operatingCarrier: null }] }, "flight.segments")} className="rounded-full border border-cyan-300/30 px-4 py-2 text-sm font-bold text-cyan-200">Add segment</button>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <TextField path="flight.airline" label="Airline" required value={reservation.flight.airline ?? ""} evidence={reservation.evidence["flight.airline"]} issue={issueFor("flight.airline")} onChange={(value) => update({ ...reservation.flight, airline: value || null }, "flight.airline")} />
        <TextField path="flight.bookingReference" label="Booking reference" value={reservation.flight.bookingReference ?? ""} evidence={reservation.evidence["flight.bookingReference"]} issue={issueFor("flight.bookingReference")} onChange={(value) => update({ ...reservation.flight, bookingReference: value || null }, "flight.bookingReference")} />
      </div>
      {issueFor("flight.segments") ? <p className="mt-4 text-sm text-red-200">{issueFor("flight.segments")?.message}</p> : null}
      <div className="mt-6 space-y-6">
        {reservation.flight.segments.map((segment, index) => {
          const prefix = `flight.segments.${index}`;
          const change = (name: keyof typeof segment, value: string) => {
            const segments = reservation.flight.segments.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, [name]: value || null } : candidate);
            update({ ...reservation.flight, segments }, `${prefix}.${name}`);
          };
          return (
            <fieldset key={segment.id} className="rounded-2xl border border-white/10 p-5">
              <div className="flex justify-between gap-4"><legend className="font-bold">Segment {index + 1}</legend><button type="button" onClick={() => update({ ...reservation.flight, segments: reservation.flight.segments.filter((_, candidateIndex) => candidateIndex !== index).map((candidate, candidateIndex) => ({ ...candidate, id: `segment-${candidateIndex + 1}` })) }, "flight.segments")} className="text-sm font-bold text-red-200">Remove</button></div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <TextField path={`${prefix}.flightNumber`} label="Flight number" value={segment.flightNumber ?? ""} evidence={reservation.evidence[`${prefix}.flightNumber`]} issue={issueFor(`${prefix}.flightNumber`)} onChange={(value) => change("flightNumber", value)} />
                <TextField path={`${prefix}.airline`} label="Segment airline" value={segment.airline ?? ""} evidence={reservation.evidence[`${prefix}.airline`]} issue={issueFor(`${prefix}.airline`)} onChange={(value) => change("airline", value)} />
                <TextField path={`${prefix}.departureAirport`} label="Departure airport/location" required value={segment.departureAirport ?? ""} evidence={reservation.evidence[`${prefix}.departureAirport`]} issue={issueFor(`${prefix}.departureAirport`)} onChange={(value) => change("departureAirport", value)} />
                <TextField path={`${prefix}.arrivalAirport`} label="Arrival airport/location" required value={segment.arrivalAirport ?? ""} evidence={reservation.evidence[`${prefix}.arrivalAirport`]} issue={issueFor(`${prefix}.arrivalAirport`)} onChange={(value) => change("arrivalAirport", value)} />
                <TextField path={`${prefix}.departureLocalDateTime`} label="Departure local date/time" type="datetime-local" required value={segment.departureLocalDateTime ?? ""} evidence={reservation.evidence[`${prefix}.departureLocalDateTime`]} issue={issueFor(`${prefix}.departureLocalDateTime`)} onChange={(value) => change("departureLocalDateTime", value)} />
                <TextField path={`${prefix}.arrivalLocalDateTime`} label="Arrival local date/time" type="datetime-local" required value={segment.arrivalLocalDateTime ?? ""} evidence={reservation.evidence[`${prefix}.arrivalLocalDateTime`]} issue={issueFor(`${prefix}.arrivalLocalDateTime`)} onChange={(value) => change("arrivalLocalDateTime", value)} />
                <TextField path={`${prefix}.departureTimezone`} label="Departure timezone" value={segment.departureTimezone ?? ""} evidence={reservation.evidence[`${prefix}.departureTimezone`]} issue={issueFor(`${prefix}.departureTimezone`)} onChange={(value) => change("departureTimezone", value)} />
                <TextField path={`${prefix}.arrivalTimezone`} label="Arrival timezone" value={segment.arrivalTimezone ?? ""} evidence={reservation.evidence[`${prefix}.arrivalTimezone`]} issue={issueFor(`${prefix}.arrivalTimezone`)} onChange={(value) => change("arrivalTimezone", value)} />
                <TextField path={`${prefix}.cabinClass`} label="Cabin/class" value={segment.cabinClass ?? ""} evidence={reservation.evidence[`${prefix}.cabinClass`]} issue={issueFor(`${prefix}.cabinClass`)} onChange={(value) => change("cabinClass", value)} />
                <TextField path={`${prefix}.operatingCarrier`} label="Operating carrier" value={segment.operatingCarrier ?? ""} evidence={reservation.evidence[`${prefix}.operatingCarrier`]} issue={issueFor(`${prefix}.operatingCarrier`)} onChange={(value) => change("operatingCarrier", value)} />
              </div>
            </fieldset>
          );
        })}
      </div>
    </section>
  );
}
