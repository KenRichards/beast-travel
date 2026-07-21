import { buildServiceWorkerSource } from "@/lib/pwa/service-worker";

export const dynamic = "force-dynamic";

export function GET() {
  const deploymentId = [
    process.env.NEXT_DEPLOYMENT_ID,
    process.env.VERCEL_GIT_COMMIT_SHA,
  ].find((value): value is string => typeof value === "string" && value.length > 0);

  return new Response(buildServiceWorkerSource(deploymentId), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Service-Worker-Allowed": "/",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
