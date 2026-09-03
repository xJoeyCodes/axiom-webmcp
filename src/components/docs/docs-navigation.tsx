const documentationSections = [
  { href: "#introduction", label: "Introduction" },
  { href: "#getting-started", label: "Getting Started" },
  { href: "#publishing", label: "Publishing" },
  { href: "#discovery", label: "Discovery" },
  { href: "#registry", label: "Registry" },
  { href: "#cli", label: "CLI" },
  { href: "#sdk", label: "SDK" },
  { href: "#architecture", label: "Architecture" },
] as const;

function NavigationList() {
  return (
    <ol className="space-y-1 font-mono text-[11px]">
      {documentationSections.map((section, index) => (
        <li key={section.href}>
          <a
            href={section.href}
            className="text-muted hover:text-foreground flex min-h-9 items-center gap-3 transition-colors duration-200"
          >
            <span className="text-muted/60 w-5 text-[9px]">
              {String(index + 1).padStart(2, "0")}
            </span>
            {section.label}
          </a>
        </li>
      ))}
    </ol>
  );
}

export function DocsNavigation() {
  return (
    <>
      <aside className="hidden lg:block">
        <nav
          aria-label="Documentation sections"
          className="sticky top-24 border-r border-white/10 pr-8"
        >
          <NavigationList />
        </nav>
      </aside>

      <details className="border-border-strong bg-elevated rounded-[4px] border lg:hidden">
        <summary className="text-secondary flex min-h-12 cursor-pointer list-none items-center px-4 font-mono text-[10px] tracking-[0.1em] uppercase">
          Documentation navigation
        </summary>
        <nav
          aria-label="Documentation sections"
          className="border-border border-t px-4 py-3"
        >
          <NavigationList />
        </nav>
      </details>
    </>
  );
}
