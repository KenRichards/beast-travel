"use client";

export default function TimelineError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center bg-neutral-950 px-5 text-white">
      <div className="mx-auto max-w-lg rounded-3xl border border-red-300/20 bg-red-300/[0.07] p-8 text-center">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-red-200">
          Timeline unavailable
        </p>
        <h1 className="mt-4 text-3xl font-black">The trip data could not be loaded.</h1>
        <p className="mt-4 leading-7 text-neutral-300">
          Existing itinerary and reservation records were not changed.
        </p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="mt-7 rounded-full bg-white px-6 py-3 font-bold text-neutral-950"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
