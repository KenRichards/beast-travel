import assert from "node:assert/strict";
import test from "node:test";

import { genericFlightParser } from "../src/lib/import/providers/generic-flight";
import { genericHotelParser } from "../src/lib/import/providers/generic-hotel";
import { genericRentalCarParser } from "../src/lib/import/providers/generic-rental-car";
import { classification, syntheticAnalysis } from "./helpers";

test("Air Canada extraction normalizes a synthetic multi-segment itinerary", async () => {
  const text = `
Air Canada
Booking reference: ABC123
Flights
Departure July 10, 2030
Exampleville AAA to Hubtown BBB
08:00 09:00
AC 101 Operated by Air Canada
Cabin: Economy Class
Hubtown BBB to Alpine City CCC
10:30 23:15 +1 day
AC 202 Operated by Air Canada
Cabin: Premium Economy
Return July 20, 2030
Alpine City CCC to Hubtown BBB
12:00 15:00
AC 203 Operated by Air Canada
Passengers
Sample Traveler
Ticket # 0000000000
`;
  const parsed = await genericFlightParser.parse(
    syntheticAnalysis(text, "local-ocr"),
    classification("flight", "air-canada"),
  );

  assert.equal(parsed.type, "flight");
  assert.equal(parsed.confirmationNumber, "ABC123");
  assert.equal(parsed.flight.segments.length, 3);
  assert.equal(parsed.flight.segments[1].arrivalLocalDateTime, "2030-07-11T23:15");
  assert.equal(parsed.evidence["flight.segments"].source, "local-ocr");
});

test("Booking.com hotel extraction reads labeled synthetic fields", async () => {
  const text = `
Booking.com Booking Confirmation
CONFIRMATION NUMBER: 1234.567.890
PIN CODE: 0000
Example Alpine Hotel CHECK-IN CHECK-OUT ROOMS NIGHTS
July 10, 2030 July 12, 2030
Address: 10 Example Lane, 1000 Sample City, Sample Country
15:00 - 22:00 07:00 - 11:00
PRICE
Number of guests: 2 adults
Deluxe Room
Phone: +00 000 0000
`;
  const parsed = await genericHotelParser.parse(
    syntheticAnalysis(text),
    classification("hotel", "booking-com"),
  );

  assert.equal(parsed.type, "hotel");
  assert.equal(parsed.confirmationNumber, "1234567890");
  assert.equal(parsed.hotel.propertyName, "Example Alpine Hotel");
  assert.equal(parsed.hotel.checkInDate, "2030-07-10");
  assert.equal(parsed.hotel.checkOutDate, "2030-07-12");
  assert.equal(parsed.hotel.guestCount, 2);
});

test("Booking.com hotel extraction infers dates from a damaged OCR calendar", async () => {
  const text = `
Booking.com Booking Confirmation
Example Lakeside Cottage CHECK-IN CHECK-OUT GUESTS ROOMS
Address: 20 Fictional Way, 2000 Exampletown, Switzerland 17 2 0 1 3
Dates: We 17 JUI 30
JULY JULY
Wednesday Saturday
15:00 - 20:00 08:00 - 10:00
`;
  const parsed = await genericHotelParser.parse(
    syntheticAnalysis(text, "local-ocr"),
    classification("hotel", "booking-com"),
  );

  assert.equal(parsed.type, "hotel");
  assert.equal(parsed.hotel.checkInDate, "2030-07-17");
  assert.equal(parsed.hotel.checkOutDate, "2030-07-20");
  assert.equal(parsed.evidence["hotel.checkInDate"].confidence, "low");
});

test("Booking.com hotel extraction reconstructs split July calendar dates using nights and weekdays", async () => {
  const text = `
Booking.com Booking Confirmation
No1 Art B&B CHECK-IN CHECK-OUT ROOMS NIGHTS
Address: Seestrasse 319B, 8804 Au, Switzerland 2 5 29 1 4
JULY JULY
Saturday Wednesday
14:00 - 19:00 08:00 - 12:00
`;
  const analysis = syntheticAnalysis(text, "local-ocr");
  analysis.metadata.pdf.creationDate = "2026-06-01T00:00:00.000Z";
  const parsed = await genericHotelParser.parse(
    analysis,
    classification("hotel", "booking-com"),
  );

  assert.equal(parsed.type, "hotel");
  assert.equal(parsed.hotel.checkInDate, "2026-07-25");
  assert.equal(parsed.hotel.checkOutDate, "2026-07-29");
});

test("Booking.com rental-car extraction reads synthetic pickup and drop-off", async () => {
  const text = `
Booking.com
Booking number
12345678
Pick-up and drop-off
Wed, July 10, 2030 - 10:00 AM
Sample Airport
2 days
Fri, July 12, 2030 - 11:30 AM
Sample Airport
Example Compact or similar
Main driver
Sample Traveler
Address
Example Rentals, 10 Sample Road, Sample City
Unlimited mileage
Collision Damage Waiver
`;
  const parsed = await genericRentalCarParser.parse(
    syntheticAnalysis(text, "local-ocr"),
    classification("rental-car", "booking-com"),
  );

  assert.equal(parsed.type, "rental-car");
  assert.equal(parsed.rentalCar.rentalProvider, "Example Rentals");
  assert.equal(parsed.rentalCar.pickupLocalDateTime, "2030-07-10T10:00");
  assert.equal(parsed.rentalCar.dropoffLocalDateTime, "2030-07-12T11:30");
  assert.deepEqual(parsed.rentalCar.includedCoverage, [
    "Unlimited mileage",
    "Collision Damage Waiver",
  ]);
});

test("Booking.com rental extraction prefers the supplied-by vendor and excludes explicitly absent coverage", async () => {
  const text = `
Booking.com
Wed, July 22, 2026 - 12:30 PM
Zurich Airport
Wed, July 29, 2026 - 12:00 PM
Zurich Airport
Supplied by Budget
Main driver Ken Richards
Unlimited mileage
This rental doesn't include Collision Damage Waiver.
This rental doesn't include Theft Protection.
`;
  const parsed = await genericRentalCarParser.parse(
    syntheticAnalysis(text, "local-ocr"),
    classification("rental-car", "booking-com"),
  );

  assert.equal(parsed.type, "rental-car");
  assert.equal(parsed.rentalCar.rentalProvider, "Budget");
  assert.equal(parsed.rentalCar.primaryDriver, "Ken Richards");
  assert.deepEqual(parsed.rentalCar.includedCoverage, ["Unlimited mileage"]);
});

test("Air Canada extraction handles OCR overnight markers and all ticketed travelers", async () => {
  const text = `
Air Canada
Booking reference: ABC123
Departure Tue 21 Jul, 2026
Raleigh Durham RDU Toronto YYZ
16:45 18:38
AC 8839 Operated by Air Canada Express - Jazz
Cabin: Economy Class (B)
Toronto YYZ Zurich ZRH
20:05 10:05 *1 day
AC 880 Operated by Air Canada
Cabin: Premium Economy (A)
Return Wed 29 Jul, 2026
Zurich ZRH Toronto YYZ
13:25 16:10
AC 881 Operated by Air Canada
Cabin: Premium Economy (A)
Passengers
Sample Traveler One
Ticket #: 0001
Sample Traveler Two
Ticket #: 0002
Sample Traveler Three
Ticket #: 0003
Purchase Summary
`;
  const parsed = await genericFlightParser.parse(
    syntheticAnalysis(text, "local-ocr"),
    classification("flight", "air-canada"),
  );

  assert.equal(parsed.type, "flight");
  assert.equal(parsed.flight.segments.length, 3);
  assert.equal(parsed.flight.segments[1].arrivalLocalDateTime, "2026-07-22T10:05");
  assert.deepEqual(parsed.travelers, [
    "Sample Traveler One",
    "Sample Traveler Two",
    "Sample Traveler Three",
  ]);
});

test("missing extracted fields are marked not found", async () => {
  const parsed = await genericHotelParser.parse(
    syntheticAnalysis("Booking.com Booking Confirmation"),
    classification("hotel", "booking-com"),
  );

  assert.equal(parsed.type, "hotel");
  assert.equal(parsed.hotel.propertyName, null);
  assert.deepEqual(parsed.evidence["hotel.propertyName"], {
    confidence: "not-found",
    source: "not-found",
  });
});
