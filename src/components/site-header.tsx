"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site";
import { AI_HUB_LIVE } from "@/lib/flags";
import { BrandMark } from "./brand-mark";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";

const DESKTOP_NAV = [
  { href: "/tools", label: "Tools" },
  ...(AI_HUB_LIVE ? [{ href: "/ai", label: "AI Hub" }] : []),
  { href: "/timezones", label: "Time Zones" },
  { href: "/guides", label: "Guides" },
  { href: "/developer", label: "Developer" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-bg/80 backdrop-blur supports-[backdrop-filter]:bg-bg/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center gap-6">
          <MobileNav />
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <BrandMark />
            <span className="font-bold sm:inline-block tracking-tight text-lg">
              {SITE.name}
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {DESKTOP_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors hover:text-fg ${
                  pathname.startsWith(item.href) ? "text-fg" : "text-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
