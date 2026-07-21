import Link from "next/link";

const LINKS = [
  { href: "/today", label: "Today" },
  { href: "/timeline", label: "Timeline" },
  { href: "/#journey", label: "Journey" },
  { href: "/trips/switzerland-2026/logistics", label: "Logistics" },
];

export default function TripNavigation({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <nav
      aria-label="Trip navigation"
      className={compact ? "min-w-0 max-w-full" : undefined}
    >
      <ul
        className={`flex items-center ${compact ? "max-w-full gap-2 overflow-x-auto pb-1" : "gap-2 sm:gap-3"}`}
      >
        {LINKS.map((link) => (
          <li key={link.href} className="shrink-0">
            <Link
              href={link.href}
              className="inline-flex rounded-full border border-white/15 bg-black/20 px-3 py-2 text-xs font-bold text-white backdrop-blur transition hover:border-cyan-300 hover:text-cyan-200 sm:px-4 sm:text-sm"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
