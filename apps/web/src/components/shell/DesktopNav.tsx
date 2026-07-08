"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./AppProvider";
import { shellT } from "./labels";

const PRIMARY = [
  { href: "/", labelKey: "home" as const },
  { href: "/dashboard", labelKey: "hotspots" as const },
  { href: "/dashboard?view=overview", labelKey: "priorities" as const },
  { href: "/vision", labelKey: "profile" as const },
];

const SECONDARY = [
  { href: "/review", labelKey: "menuReview" as const },
  { href: "/voice", labelKey: "menuVoice" as const },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/dashboard")) return pathname.startsWith("/dashboard");
  return pathname.startsWith(href);
}

export function DesktopNav() {
  const pathname = usePathname();
  const { locale } = useApp();

  return (
    <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
      {PRIMARY.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              active ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            {shellT(item.labelKey, locale)}
          </Link>
        );
      })}
      <span className="mx-2 h-4 w-px bg-white/20" aria-hidden />
      {SECONDARY.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-lg px-3 py-2 text-sm font-medium text-white/65 transition-colors hover:bg-white/10 hover:text-white"
        >
          {shellT(item.labelKey, locale)}
        </Link>
      ))}
    </nav>
  );
}
