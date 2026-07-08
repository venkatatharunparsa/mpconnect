"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./AppProvider";
import { shellT } from "./labels";

type LabelKey =
  | "dashboard"
  | "issues"
  | "register"
  | "map"
  | "profile"
  | "workspace"
  | "menuReview"
  | "menuVoice"
  | "menuVision";

function navForRole(role: ReturnType<typeof useApp>["role"]): { href: string; labelKey: LabelKey }[] {
  if (role === "mp") {
    return [
      { href: "/mp", labelKey: "issues" },
      { href: "/mp/issues", labelKey: "dashboard" },
      { href: "/mp/map", labelKey: "map" },
      { href: "/mp/profile", labelKey: "profile" },
    ];
  }
  if (role === "official") {
    return [
      { href: "/authority", labelKey: "dashboard" },
      { href: "/authority/workspace", labelKey: "workspace" },
      { href: "/authority/issues", labelKey: "issues" },
      { href: "/authority/map", labelKey: "map" },
      { href: "/authority/profile", labelKey: "profile" },
    ];
  }
  return [
    { href: "/user", labelKey: "issues" },
    { href: "/user/issues", labelKey: "dashboard" },
    { href: "/user/register", labelKey: "register" },
    { href: "/user/map", labelKey: "map" },
    { href: "/user/profile", labelKey: "profile" },
  ];
}

function isActive(pathname: string, href: string) {
  if (href === "/mp" || href === "/user" || href === "/authority") return pathname === href;
  return pathname.startsWith(href);
}

export function DesktopNav() {
  const pathname = usePathname() ?? "/";
  const { locale, role } = useApp();
  const nav = navForRole(role);

  return (
    <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label="Main">
      {nav.map((item) => {
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
    </nav>
  );
}
