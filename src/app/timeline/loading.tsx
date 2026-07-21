export default function TimelineLoading() {
  return (
    <main className="min-h-screen bg-neutral-950 px-5 py-16 text-white" aria-busy="true">
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="h-5 w-40 rounded bg-white/10" />
        <div className="mt-10 h-12 max-w-xl rounded bg-white/10" />
        <div className="mt-16 h-8 w-56 rounded bg-white/10" />
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-40 rounded-2xl border border-white/10 bg-white/5" />
          ))}
        </div>
        <p className="sr-only">Loading trip timeline</p>
      </div>
    </main>
  );
}
