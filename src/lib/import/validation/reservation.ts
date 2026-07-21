import type { NormalizedReservation } from "../reservation";

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ReservationValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

function isPresent(value: string | null | undefined): value is string {
  return Boolean(value?.trim());
}

function isDate(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function isLocalDateTime(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value));
}

function required(
  errors: ValidationIssue[],
  path: string,
  value: string | null | undefined,
  label: string,
): void {
  if (!isPresent(value)) errors.push({ path, message: `${label} is required.` });
}

function validateHotel(
  reservation: Extract<NormalizedReservation, { type: "hotel" }>,
  errors: ValidationIssue[],
): void {
  required(errors, "hotel.propertyName", reservation.hotel.propertyName, "Property name");
  required(errors, "hotel.checkInDate", reservation.hotel.checkInDate, "Check-in date");
  required(errors, "hotel.checkOutDate", reservation.hotel.checkOutDate, "Check-out date");

  if (reservation.hotel.checkInDate && !isDate(reservation.hotel.checkInDate)) {
    errors.push({ path: "hotel.checkInDate", message: "Use a valid check-in date." });
  }
  if (reservation.hotel.checkOutDate && !isDate(reservation.hotel.checkOutDate)) {
    errors.push({ path: "hotel.checkOutDate", message: "Use a valid check-out date." });
  }
  if (
    isDate(reservation.hotel.checkInDate) &&
    isDate(reservation.hotel.checkOutDate) &&
    reservation.hotel.checkOutDate <= reservation.hotel.checkInDate
  ) {
    errors.push({
      path: "hotel.checkOutDate",
      message: "Check-out must be after check-in.",
    });
  }
}

function validateRentalCar(
  reservation: Extract<NormalizedReservation, { type: "rental-car" }>,
  errors: ValidationIssue[],
): void {
  const car = reservation.rentalCar;
  required(errors, "rentalCar.rentalProvider", car.rentalProvider, "Rental provider");
  required(errors, "rentalCar.pickupLocation", car.pickupLocation, "Pickup location");
  required(errors, "rentalCar.dropoffLocation", car.dropoffLocation, "Drop-off location");
  required(errors, "rentalCar.pickupLocalDateTime", car.pickupLocalDateTime, "Pickup date and time");
  required(errors, "rentalCar.dropoffLocalDateTime", car.dropoffLocalDateTime, "Drop-off date and time");

  if (car.pickupLocalDateTime && !isLocalDateTime(car.pickupLocalDateTime)) {
    errors.push({ path: "rentalCar.pickupLocalDateTime", message: "Use a valid pickup date and time." });
  }
  if (car.dropoffLocalDateTime && !isLocalDateTime(car.dropoffLocalDateTime)) {
    errors.push({ path: "rentalCar.dropoffLocalDateTime", message: "Use a valid drop-off date and time." });
  }
  if (
    isLocalDateTime(car.pickupLocalDateTime) &&
    isLocalDateTime(car.dropoffLocalDateTime) &&
    car.dropoffLocalDateTime <= car.pickupLocalDateTime
  ) {
    errors.push({
      path: "rentalCar.dropoffLocalDateTime",
      message: "Drop-off must be after pickup.",
    });
  }
}

function validateFlight(
  reservation: Extract<NormalizedReservation, { type: "flight" }>,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): void {
  if (!isPresent(reservation.flight.airline) && !isPresent(reservation.provider)) {
    errors.push({ path: "flight.airline", message: "Airline or provider is required." });
  }
  if (reservation.flight.segments.length === 0) {
    errors.push({ path: "flight.segments", message: "At least one flight segment is required." });
    return;
  }

  reservation.flight.segments.forEach((segment, index) => {
    const prefix = `flight.segments.${index}`;
    required(errors, `${prefix}.departureAirport`, segment.departureAirport, "Departure location");
    required(errors, `${prefix}.arrivalAirport`, segment.arrivalAirport, "Arrival location");
    required(errors, `${prefix}.departureLocalDateTime`, segment.departureLocalDateTime, "Departure date and time");
    required(errors, `${prefix}.arrivalLocalDateTime`, segment.arrivalLocalDateTime, "Arrival date and time");

    if (segment.departureLocalDateTime && !isLocalDateTime(segment.departureLocalDateTime)) {
      errors.push({ path: `${prefix}.departureLocalDateTime`, message: "Use a valid departure date and time." });
    }
    if (segment.arrivalLocalDateTime && !isLocalDateTime(segment.arrivalLocalDateTime)) {
      errors.push({ path: `${prefix}.arrivalLocalDateTime`, message: "Use a valid arrival date and time." });
    }
    if (
      isLocalDateTime(segment.departureLocalDateTime) &&
      isLocalDateTime(segment.arrivalLocalDateTime)
    ) {
      if (
        segment.departureTimezone &&
        segment.arrivalTimezone &&
        segment.departureTimezone === segment.arrivalTimezone &&
        segment.arrivalLocalDateTime <= segment.departureLocalDateTime
      ) {
        errors.push({
          path: `${prefix}.arrivalLocalDateTime`,
          message: "Arrival must be after departure.",
        });
      } else if (
        !segment.departureTimezone ||
        !segment.arrivalTimezone ||
        segment.departureTimezone !== segment.arrivalTimezone
      ) {
        warnings.push({
          path: `${prefix}.arrivalLocalDateTime`,
          message: "Time-zone certainty is insufficient for automatic chronology validation.",
        });
      }
    }
  });
}

export function validateReservation(
  reservation: NormalizedReservation,
): ReservationValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (reservation.type === "hotel") validateHotel(reservation, errors);
  if (reservation.type === "rental-car") validateRentalCar(reservation, errors);
  if (reservation.type === "flight") validateFlight(reservation, errors, warnings);

  return { valid: errors.length === 0, errors, warnings };
}
