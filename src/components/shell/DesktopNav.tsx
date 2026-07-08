"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./AppProvider";
import { shellT } from "./labels";


const STAFF = [
  { href: "/review", labelKey: "menuReview" as const },
  { href: "/voice", labelKey: "menuVoice" as const },
  { href: "/vision", labelKey: "menuVision" as const },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href.includes("/dashboard")) {
    return pathname.includes("/dashboard");
  }
  if (href === "/map") return pathname.startsWith("/map");
  return pathname.startsWith(href);
}

export function DesktopNav() {
  const pathname = usePathname() ?? "/";
  const { locale } = useApp();

  let dashboardHref = "/citizen/dashboard";
  if (pathname.startsWith("/mp")) {
    dashboardHref = "/mp/dashboard";
  } else if (pathname.startsWith("/official")) {
    dashboardHref = "/official/dashboard";
  }

  const primaryItems = [
    { href: "/", labelKey: "home" as const },
    { href: "/map", labelKey: "map" as const },
    { href: "/submit", labelKey: "reportIssue" as const },
    { href: dashboardHref, labelKey: "priorities" as const },
  ];

  return (
    <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label="Main">
      {primaryItems.map((item) => {
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
      {STAFF.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-lg px-3 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          {shellT(item.labelKey, locale)}
        </Link>
      ))}
    </nav>
  );
}
