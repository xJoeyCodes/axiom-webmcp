"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils/cn";

interface MobileNavProps {
  links: ReadonlyArray<{ href: string; label: string }>;
}

export function MobileNav({ links }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="sm:hidden">
      <button
        type="button"
        className="text-secondary hover:bg-surface-hover hover:text-foreground flex size-9 items-center justify-center rounded-[5px] transition-colors"
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
          className="border-border bg-background absolute inset-x-0 top-full border-b px-5 py-4"
        >
          <nav aria-label="Mobile navigation" className="grid gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  "text-secondary hover:bg-surface-hover hover:text-foreground rounded-[5px] px-3 py-3 text-sm transition-colors",
                  pathname === link.href && "text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-secondary hover:bg-surface-hover hover:text-foreground rounded-[5px] px-3 py-3 text-sm transition-colors"
            >
              GitHub <span aria-hidden>↗</span>
            </a>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
