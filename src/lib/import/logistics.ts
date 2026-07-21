import type { ApprovedReservation } from "./reservation";
import type {
  Accommodation,
  TripLogistics,
  TripReservation,
} from "@/types/logistics";

function datePart(value: string | null): string | undefined {
  return value?.slice(0, 10) || undefined;
}

function timePart(value: string | null): string | undefined {
  return value?.slice(11, 16) || undefined;
}

function importedFlightReservations(
  reservation: Extract<ApprovedReservation, { type: "flight" }>,
): TripReservation[] {
  return reservation.flight.segments.map((segment, index) => ({
    id: `${reservation.id}-segment-${index + 1}`,
    type: "flight",
    title: [segment.departureAirport, segment.arrivalAirport]
      .filter(Boolean)
      .join(" → ") || "Imported flight",
    provider: segment.airline ?? reservation.provider ?? undefined,
    status: "confirmed",
    date: datePart(segment.departureLocalDateTime),
    startTime: timePart(segment.departureLocalDateTime),
    endTime: timePart(segment.arrivalLocalDateTime),
    location: [segment.departureAirport, segment.arrivalAirport]
      .filter(Boolean)
      .join(" → ") || undefined,
    confirmationReference: reservation.confirmationNumber ?? undefined,
    travelers: reservation.travelers.length || undefined,
    notes: [
      segment.flightNumber ? `Flight ${segment.flightNumber}` : null,
      segment.cabinClass ? `Cabin: ${segment.cabinClass}` : null,
      segment.operatingCarrier
        ? `Operated by ${segment.operatingCarrier}`
        : null,
      segment.arrivalLocalDateTime
        ? `Arrives ${segment.arrivalLocalDateTime.replace("T", " ")}`
        : null,
    ].filter((value): value is string => Boolean(value)),
    source: "imported",
    reservationDetailHref: `/reservations/${reservation.id}`,
  }));
}

function importedHotelEntries(
  reservation: Extract<ApprovedReservation, { type: "hotel" }>,
): { accommodations: Accommodation[]; reservations: TripReservation[] } {
  const hotel = reservation.hotel;
  const detailHref = `/reservations/${reservation.id}`;
  const accommodations: Accommodation[] =
    hotel.propertyName && hotel.checkInDate && hotel.checkOutDate
      ? [
          {
            id: reservation.id,
            name: hotel.propertyName,
            city: hotel.city ?? "Location not provided",
            status: "confirmed",
            checkInDate: hotel.checkInDate,
            checkOutDate: hotel.checkOutDate,
            checkInTime: hotel.checkInTime ?? undefined,
            checkOutTime: hotel.checkOutTime ?? undefined,
            address: hotel.address ?? undefined,
            confirmationReference: reservation.confirmationNumber ?? undefined,
            notes: hotel.accommodationType
              ? [`Accommodation: ${hotel.accommodationType}`]
              : undefined,
            source: "imported",
            reservationDetailHref: detailHref,
          },
        ]
      : [];
  const candidates: Array<TripReservation | null> = [
    hotel.checkInDate
      ? {
          id: `${reservation.id}-check-in`,
          type: "hotel",
          title: `Check in: ${hotel.propertyName ?? "Imported lodging"}`,
          provider: reservation.provider ?? undefined,
          status: "confirmed",
          date: hotel.checkInDate,
          startTime: hotel.checkInTime ?? undefined,
          location: hotel.city ?? undefined,
          confirmationReference: reservation.confirmationNumber ?? undefined,
          source: "imported",
          reservationDetailHref: detailHref,
        }
      : null,
    hotel.checkOutDate
      ? {
          id: `${reservation.id}-check-out`,
          type: "hotel",
          title: `Check out: ${hotel.propertyName ?? "Imported lodging"}`,
          provider: reservation.provider ?? undefined,
          status: "confirmed",
          date: hotel.checkOutDate,
          startTime: hotel.checkOutTime ?? undefined,
          location: hotel.city ?? undefined,
          confirmationReference: reservation.confirmationNumber ?? undefined,
          source: "imported",
          reservationDetailHref: detailHref,
        }
      : null,
  ];
  const reservations = candidates.filter(
    (value): value is TripReservation => value !== null,
  );

  return { accommodations, reservations };
}

function importedRentalCarReservations(
  reservation: Extract<ApprovedReservation, { type: "rental-car" }>,
): TripReservation[] {
  const car = reservation.rentalCar;
  const detailHref = `/reservations/${reservation.id}`;
  const candidates: Array<TripReservation | null> = [
    car.pickupLocalDateTime
      ? {
          id: `${reservation.id}-pickup`,
          type: "rental-car" as const,
          title: `Rental-car pickup${car.vehicleCategory ? ` · ${car.vehicleCategory}` : ""}`,
          provider: car.rentalProvider ?? reservation.provider ?? undefined,
          status: "confirmed" as const,
          date: datePart(car.pickupLocalDateTime),
          startTime: timePart(car.pickupLocalDateTime),
          location: car.pickupLocation ?? undefined,
          confirmationReference: reservation.confirmationNumber ?? undefined,
          source: "imported" as const,
          reservationDetailHref: detailHref,
        }
      : null,
    car.dropoffLocalDateTime
      ? {
          id: `${reservation.id}-dropoff`,
          type: "rental-car" as const,
          title: "Rental-car drop-off",
          provider: car.rentalProvider ?? reservation.provider ?? undefined,
          status: "confirmed" as const,
          date: datePart(car.dropoffLocalDateTime),
          startTime: timePart(car.dropoffLocalDateTime),
          location: car.dropoffLocation ?? undefined,
          confirmationReference: reservation.confirmationNumber ?? undefined,
          source: "imported" as const,
          reservationDetailHref: detailHref,
        }
      : null,
  ];
  return candidates.filter((value): value is TripReservation => value !== null);
}

export function mapApprovedReservationsToLogistics(
  reservations: ApprovedReservation[],
): Pick<TripLogistics, "accommodations" | "reservations"> {
  const importedReservations: TripReservation[] = [];
  const accommodations: Accommodation[] = [];

  for (const reservation of reservations) {
    if (reservation.type === "flight") {
      importedReservations.push(...importedFlightReservations(reservation));
    } else if (reservation.type === "hotel") {
      const hotel = importedHotelEntries(reservation);
      importedReservations.push(...hotel.reservations);
      accommodations.push(...hotel.accommodations);
    } else {
      importedReservations.push(...importedRentalCarReservations(reservation));
    }
  }

  return { reservations: importedReservations, accommodations };
}

export function mergeImportedLogistics(
  manual: TripLogistics,
  approved: ApprovedReservation[],
): TripLogistics {
  const imported = mapApprovedReservationsToLogistics(approved);
  const accommodations = new Map(manual.accommodations.map((entry) => [entry.id, entry]));
  const reservations = new Map(manual.reservations.map((entry) => [entry.id, entry]));
  imported.accommodations.forEach((entry) => accommodations.set(entry.id, entry));
  imported.reservations.forEach((entry) => reservations.set(entry.id, entry));
  return {
    ...manual,
    accommodations: [...accommodations.values()],
    reservations: [...reservations.values()],
  };
}
