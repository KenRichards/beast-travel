import { getItinerary } from "@/lib/itinerary";
import { PWA_SCHEMA_VERSION } from "@/lib/pwa/cache";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { cacheVersion: PWA_SCHEMA_VERSION, itinerary: getItinerary(), updatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
