import { listIncomingDocuments } from "@/lib/import/documents";
import { loadApprovedReservations } from "@/lib/import/persistence/reservations";
import { PWA_SCHEMA_VERSION } from "@/lib/pwa/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const [documents, approved] = await Promise.all([
    listIncomingDocuments(),
    loadApprovedReservations(),
  ]);
  return Response.json(
    {
      cacheVersion: PWA_SCHEMA_VERSION,
      documents,
      approvedReservationIds: approved.reservations.map((reservation) => reservation.id),
      updatedAt: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
