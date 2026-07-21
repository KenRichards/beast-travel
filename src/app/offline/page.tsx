import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-neutral-950 px-6 text-white">
      <section className="max-w-xl rounded-[2rem] border border-amber-300/20 bg-amber-300/[0.06] p-8 text-center sm:p-12" aria-labelledby="offline-title">
        <span className="text-5xl" aria-hidden="true">↯</span>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-amber-200">No connection</p>
        <h1 id="offline-title" className="mt-4 text-4xl font-black">This page is not saved yet.</h1>
        <p className="mt-5 leading-7 text-neutral-300">
          Your Travel Pack and previously opened trip pages are still available. Reconnect once to save this page for later.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/travel-pack" className="rounded-full bg-amber-200 px-5 py-3 font-bold text-neutral-950">Open Travel Pack</Link>
          <Link href="/today" className="rounded-full border border-white/15 px-5 py-3 font-bold">Open Today</Link>
        </div>
      </section>
    </main>
  );
}
