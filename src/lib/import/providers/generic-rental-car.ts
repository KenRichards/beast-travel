import type { ReservationProviderParser } from "../parser";
import {
  createMockConfirmation,
  createReservationSource,
  mockTravelers,
} from "./mock";

const parserId = "generic-rental-car-pdf";

export const genericRentalCarParser: ReservationProviderParser = {
  id: parserId,
  displayName: "Generic Rental Car PDF",
  canParse(classification) {
    return classification.providerHint === parserId;
  },
  async parse(document, classification) {
    return {
      schemaVersion: 1,
      type: "rental-car",
      provider: "Generic Rental Car PDF",
      confirmationNumber: createMockConfirmation("CAR", document),
      dates: {
        start: "2026-07-22T10:00:00+02:00",
        end: "2026-07-29T10:00:00+02:00",
        timeZone: "Europe/Zurich",
      },
      travelers: mockTravelers,
      location: {
        name: "Zürich Airport",
        city: "Kloten",
        country: "Switzerland",
        iataCode: "ZRH",
      },
      rentalCar: {
        company: "Sample Car Rental",
        pickupLocation: "Zürich Airport",
        dropoffLocation: "Zürich Airport",
        vehicleClass: "Compact SUV",
      },
      parsedFields: {
        company: "Sample Car Rental",
        pickupLocation: "Zürich Airport",
        dropoffLocation: "Zürich Airport",
        vehicleClass: "Compact SUV",
        unlimitedMileage: true,
      },
      source: createReservationSource(parserId, document, classification),
    };
  },
};
