import type { ReservationProviderParser } from "../parser";
import {
  createMockConfirmation,
  createReservationSource,
  mockTravelers,
} from "./mock";

const parserId = "generic-hotel-pdf";

export const genericHotelParser: ReservationProviderParser = {
  id: parserId,
  displayName: "Generic Hotel PDF",
  canParse(classification) {
    return classification.providerHint === parserId;
  },
  async parse(document, classification) {
    return {
      schemaVersion: 1,
      type: "hotel",
      provider: "Generic Hotel PDF",
      confirmationNumber: createMockConfirmation("HTL", document),
      dates: {
        start: "2026-07-22T15:00:00+02:00",
        end: "2026-07-25T11:00:00+02:00",
        timeZone: "Europe/Zurich",
      },
      travelers: mockTravelers,
      location: {
        name: "Sample Alpine Hotel",
        address: "1 Bahnhofplatz",
        city: "Zürich",
        country: "Switzerland",
      },
      hotel: {
        propertyName: "Sample Alpine Hotel",
        roomType: "King room",
        nights: 3,
      },
      parsedFields: {
        propertyName: "Sample Alpine Hotel",
        roomType: "King room",
        nights: 3,
        breakfastIncluded: true,
        specialRequests: null,
      },
      source: createReservationSource(parserId, document, classification),
    };
  },
};
