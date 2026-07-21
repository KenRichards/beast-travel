import assert from "node:assert/strict";
import test from "node:test";

import { validateReservation } from "../src/lib/import/validation/reservation";
import { validFlight, validHotel, validRentalCar } from "./helpers";

test("type-specific validation accepts complete reservations", () => {
  assert.equal(validateReservation(validHotel()).valid, true);
  assert.equal(validateReservation(validRentalCar()).valid, true);
  assert.equal(validateReservation(validFlight()).valid, true);
});

test("type-specific validation reports missing required fields", () => {
  const hotel = validHotel();
  hotel.hotel.propertyName = null;
  const car = validRentalCar();
  car.rentalCar.pickupLocation = null;
  const flight = validFlight();
  flight.flight.segments = [];

  assert.deepEqual(validateReservation(hotel).errors.map((error) => error.path), [
    "hotel.propertyName",
  ]);
  assert.ok(
    validateReservation(car).errors.some(
      (error) => error.path === "rentalCar.pickupLocation",
    ),
  );
  assert.ok(
    validateReservation(flight).errors.some(
      (error) => error.path === "flight.segments",
    ),
  );
});

test("chronology validation rejects reversed hotel, car, and comparable flights", () => {
  const hotel = validHotel();
  hotel.hotel.checkOutDate = hotel.hotel.checkInDate;
  const car = validRentalCar();
  car.rentalCar.dropoffLocalDateTime = "2030-07-09T10:00";
  const flight = validFlight();
  flight.flight.segments[0].arrivalLocalDateTime = "2030-07-10T07:00";

  assert.ok(validateReservation(hotel).errors.some((error) => error.path === "hotel.checkOutDate"));
  assert.ok(validateReservation(car).errors.some((error) => error.path === "rentalCar.dropoffLocalDateTime"));
  assert.ok(validateReservation(flight).errors.some((error) => error.path.endsWith("arrivalLocalDateTime")));
});

test("flight chronology warns instead of failing across uncertain timezones", () => {
  const flight = validFlight();
  flight.flight.segments[0].arrivalLocalDateTime = "2030-07-10T07:00";
  flight.flight.segments[0].arrivalTimezone = "Europe/Example";
  const result = validateReservation(flight);

  assert.equal(result.valid, true);
  assert.equal(result.warnings.length, 1);
});
