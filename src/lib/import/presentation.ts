import type { ApprovedReservation } from "./reservation";

export function reservationPrimaryDateRange(
  reservation: ApprovedReservation,
): string {
  if (reservation.type === "hotel") {
    return [reservation.hotel.checkInDate, reservation.hotel.checkOutDate]
      .filter(Boolean)
      .join(" → ") || "Dates not provided";
  }
  if (reservation.type === "rental-car") {
    return [
      reservation.rentalCar.pickupLocalDateTime,
      reservation.rentalCar.dropoffLocalDateTime,
    ]
      .filter(Boolean)
      .join(" → ") || "Dates not provided";
  }
  const segments = reservation.flight.segments;
  return [
    segments[0]?.departureLocalDateTime,
    segments.at(-1)?.arrivalLocalDateTime,
  ]
    .filter(Boolean)
    .join(" → ") || "Dates not provided";
}

export function reservationProvider(reservation: ApprovedReservation): string {
  if (reservation.type === "rental-car") {
    return (
      reservation.rentalCar.rentalProvider ??
      reservation.rentalCar.bookingPlatform ??
      reservation.provider ??
      "Not provided"
    );
  }
  return reservation.provider ?? "Not provided";
}
