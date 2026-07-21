import { genericFlightParser } from "./generic-flight";
import { genericHotelParser } from "./generic-hotel";
import { genericRentalCarParser } from "./generic-rental-car";

import type { ReservationProviderParser } from "../parser";

export const providerParsers: readonly ReservationProviderParser[] = [
  genericHotelParser,
  genericRentalCarParser,
  genericFlightParser,
];

export {
  genericFlightParser,
  genericHotelParser,
  genericRentalCarParser,
};
