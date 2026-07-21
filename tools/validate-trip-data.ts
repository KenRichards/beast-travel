import { loadApprovedReservations } from "../src/lib/import/persistence/reservations";
import { getItinerary } from "../src/lib/itinerary";
import { formatTripDataValidation, validateTripData } from "../src/lib/trip-data-validation";

void (async () => {
  const loaded = await loadApprovedReservations();
  const result = validateTripData(getItinerary(), loaded.reservations);

  console.log(formatTripDataValidation(result));
  if (!result.valid) process.exitCode = 1;
})();
