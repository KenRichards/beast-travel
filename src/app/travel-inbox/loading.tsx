export default function TravelInboxLoading() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-20 text-white sm:px-10">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="h-4 w-32 rounded bg-cyan-300/20" />
        <div className="mt-8 h-14 w-72 rounded-xl bg-white/10" />
        <div className="mt-14 h-80 rounded-3xl border border-white/10 bg-white/[0.04]" />
      </div>
    </main>
  );
}
