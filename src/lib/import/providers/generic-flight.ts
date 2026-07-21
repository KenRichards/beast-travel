import type { ReservationProviderParser } from "../parser";
import {
  createMockConfirmation,
  createReservationSource,
  mockTravelers,
} from "./mock";

const parserId = "generic-flight-pdf";

export const genericFlightParser: ReservationProviderParser = {
  id: parserId,
  displayName: "Generic Flight PDF",
  canParse(classification) {
    return (
      classification.probableType === "flight" &&
      classification.probableProvider?.id === "air-canada"
    );
  },
  async parse(document, classification) {
    return {
      schemaVersion: 1,
      type: "flight",
      provider: "Generic Flight PDF",
      confirmationNumber: createMockConfirmation("FLT", document),
      dates: {
        start: "2026-07-21T18:30:00-04:00",
        end: "2026-07-22T08:15:00+02:00",
        timeZone: "America/Detroit",
      },
      travelers: mockTravelers,
      location: {
        name: "Detroit to Zürich",
        city: "Detroit / Zürich",
        country: "United States / Switzerland",
      },
      flight: {
        airline: "Sample Airways",
        flightNumber: "BT 21",
        departureAirport: "DTW",
        arrivalAirport: "ZRH",
      },
      parsedFields: {
        airline: "Sample Airways",
        flightNumber: "BT 21",
        departureAirport: "DTW",
        arrivalAirport: "ZRH",
        cabin: "Economy",
        checkedBags: 1,
      },
      source: createReservationSource(parserId, document, classification),
    };
  },
};
