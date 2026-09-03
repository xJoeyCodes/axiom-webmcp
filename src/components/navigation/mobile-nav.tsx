"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";

interface MobileNavProps {
  links: ReadonlyArray<{ href: string; label: string }>;
  githubUrl: string;
}

function isActivePath(pathname: string, href: string) {
  if (href === "/discover" && pathname.startsWith("/site/")) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav({ links, githubUrl }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="sm:hidden">
      <button
        ref={triggerRef}
        type="button"
        className="text-secondary hover:bg-surface-hover hover:text-foreground flex size-10 items-center justify-center rounded-[5px] transition-colors duration-200"
        aria-controls="mobile-navigation"
        aria-expanded={open}
        aria-label={open ? "Close navigation" : "Open navigation"}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X aria-hidden size={18} /> : <Menu aria-hidden size={18} />}
      </button>
      {open ? (
        <div
          id="mobile-navigation"
          className="border-border bg-background/96 absolute inset-x-0 top-full border-b px-5 py-4 backdrop-blur-md"
        >
          <nav aria-label="Mobile navigation" className="grid gap-1">
            {links.map((link) => {
              const active = isActivePath(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "text-secondary hover:bg-surface-hover hover:text-foreground rounded-[5px] px-3 py-3 text-sm transition-colors duration-200",
                    active && "text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open Axiom on GitHub in a new tab"
              className="text-secondary hover:bg-surface-hover hover:text-foreground rounded-[5px] px-3 py-3 text-sm transition-colors duration-200"
            >
              GitHub <span aria-hidden>↗</span>
            </a>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
