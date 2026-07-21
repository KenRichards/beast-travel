import { loadApprovedReservations } from "@/lib/import/persistence/reservations";
import { PWA_SCHEMA_VERSION } from "@/lib/pwa/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const loaded = await loadApprovedReservations();
  return Response.json(
    { cacheVersion: PWA_SCHEMA_VERSION, ...loaded, updatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
