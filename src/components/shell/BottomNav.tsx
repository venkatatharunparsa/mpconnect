"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./AppProvider";
import { IconHome, IconMap, IconMic, IconStats, IconUser } from "./icons";
import { shellT } from "./labels";

/** Citizen-first flow: Home → Map → Report → Priorities → About */
const NAV = [
  { href: "/", labelKey: "home" as const, icon: IconHome },
  { href: "/map", labelKey: "map" as const, icon: IconMap },
  { href: "/submit", labelKey: "reportIssue" as const, icon: IconMic, fab: true },
  { href: "/dashboard", labelKey: "priorities" as const, icon: IconStats },
  { href: "/vision", labelKey: "visionShort" as const, icon: IconUser },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/dashboard") return pathname.startsWith("/dashboard");
  if (href === "/map") return pathname.startsWith("/map");
  return pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname() ?? "/";
  const { locale } = useApp();

  if (
    pathname.startsWith("/review") ||
    pathname.startsWith("/docs") ||
    pathname.startsWith("/mp") ||
    pathname.startsWith("/citizen") ||
    pathname.startsWith("/official")
  ) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-md lg:hidden"
      aria-label="Main"
    >
      <div
        className="mx-auto flex h-16 max-w-lg items-end justify-around px-2 pb-2 sm:max-w-none sm:px-6"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;

          if (item.fab) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="-mt-7 flex flex-col items-center"
                aria-label={shellT(item.labelKey, locale)}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-fab transition-transform hover:scale-105 active:scale-95">
                  <Icon className="h-7 w-7" />
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-[3.5rem] flex-col items-center gap-0.5 pb-2 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                active ? "text-primary" : "text-slate-400"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
              <span className="truncate">{shellT(item.labelKey, locale)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
