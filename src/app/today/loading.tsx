export default function TodayLoading() {
  return (
    <main className="min-h-screen bg-neutral-950 px-5 py-16 text-white" aria-busy="true">
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="h-5 w-40 rounded bg-white/10" />
        <div className="mt-14 h-14 max-w-2xl rounded bg-white/10" />
        <div className="mt-16 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="h-72 rounded-3xl bg-white/5" />
          <div className="h-60 rounded-3xl bg-white/5" />
        </div>
        <p className="sr-only">Loading Today dashboard</p>
      </div>
    </main>
  );
}
