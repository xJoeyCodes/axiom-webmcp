import Link from "next/link";

const suggestions = [
  "Book a flight",
  "Reserve dinner",
  "Find an event",
] as const;

export function SuggestedQueries() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      <span className="text-muted mr-1 font-mono text-[9px] tracking-[0.14em] uppercase">
        Try
      </span>
      {suggestions.map((suggestion) => (
        <Link
          key={suggestion}
          href={`/discover?${new URLSearchParams({ q: suggestion }).toString()}`}
          className="border-border text-muted hover:bg-surface-hover hover:text-secondary rounded-full border px-3 py-1.5 text-[11px] transition-[border-color,color,background-color] duration-200 hover:border-white/15"
        >
          {suggestion}
        </Link>
      ))}
    </div>
  );
}
