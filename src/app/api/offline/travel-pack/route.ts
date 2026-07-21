import { loadApprovedReservations } from "@/lib/import/persistence/reservations";
import { getItinerary } from "@/lib/itinerary";
import { PWA_SCHEMA_VERSION } from "@/lib/pwa/cache";
import { generateTravelPack } from "@/lib/travel-pack";

export const dynamic = "force-dynamic";

export async function GET() {
  const loaded = await loadApprovedReservations();
  return Response.json(
    {
      cacheVersion: PWA_SCHEMA_VERSION,
      travelPack: generateTravelPack(getItinerary(), loaded.reservations),
      malformedReservationFiles: loaded.malformedFiles,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
