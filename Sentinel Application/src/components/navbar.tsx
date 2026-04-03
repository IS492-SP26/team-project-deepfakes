"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, FileInput, LayoutDashboard, Archive } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Ingestion", icon: FileInput },
  { href: "/clinical", label: "Clinical View", icon: LayoutDashboard },
  { href: "/archive", label: "Archive", icon: Archive },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 glow-cyan">
            <Shield className="h-4.5 w-4.5 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            <span className="text-primary glow-text">Sentinel</span>
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              v0.1
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
