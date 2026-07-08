"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./AppProvider";
import { IconHome, IconMap, IconMic, IconStats, IconUser } from "./icons";
import { shellT } from "./labels";

type NavItem = {
  href: string;
  labelKey:
    | "dashboard"
    | "issues"
    | "register"
    | "map"
    | "profile"
    | "workspace"
    | "reportIssue";
  icon: typeof IconHome;
  fab?: boolean;
};

function navForRole(role: ReturnType<typeof useApp>["role"]): NavItem[] {
  if (role === "mp") {
    return [
      { href: "/mp", labelKey: "issues", icon: IconHome },
      { href: "/mp/issues", labelKey: "dashboard", icon: IconStats },
      { href: "/mp/map", labelKey: "map", icon: IconMap },
      { href: "/mp/profile", labelKey: "profile", icon: IconUser },
    ];
  }
  if (role === "official") {
    return [
      { href: "/authority", labelKey: "dashboard", icon: IconStats },
      { href: "/authority/workspace", labelKey: "workspace", icon: IconHome },
      { href: "/authority/issues", labelKey: "issues", icon: IconMic },
      { href: "/authority/map", labelKey: "map", icon: IconMap },
      { href: "/authority/profile", labelKey: "profile", icon: IconUser },
    ];
  }
  return [
    { href: "/user", labelKey: "issues", icon: IconHome },
    { href: "/user/issues", labelKey: "dashboard", icon: IconStats },
    { href: "/user/register", labelKey: "register", icon: IconMic, fab: true },
    { href: "/user/map", labelKey: "map", icon: IconMap },
    { href: "/user/profile", labelKey: "profile", icon: IconUser },
  ];
}

function isActive(pathname: string, href: string) {
  if (href === "/mp" || href === "/user" || href === "/authority") {
    return pathname === href;
  }
  return pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname() ?? "/";
  const { locale, role } = useApp();
  const nav = navForRole(role);

  if (pathname === "/" || pathname.startsWith("/docs")) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-md lg:hidden"
      aria-label="Main"
    >
      <div
        className="mx-auto flex h-16 max-w-lg items-end justify-around px-2 pb-2 sm:max-w-none sm:px-6"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        {nav.map((item) => {
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
