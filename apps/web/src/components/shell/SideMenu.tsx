"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./AppProvider";
import { shellT } from "./labels";

type MenuLink = {
  href: string;
  labelKey:
    | "dashboard"
    | "issues"
    | "workspace"
    | "map"
    | "register"
    | "profile"
    | "menuReview"
    | "menuVoice";
};

function menuLinks(role: ReturnType<typeof useApp>["role"]): MenuLink[] {
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
      { href: "/authority", labelKey: "issues" },
      { href: "/authority/workspace", labelKey: "workspace" },
      { href: "/authority/issues", labelKey: "dashboard" },
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
    { href: "/voice", labelKey: "menuVoice" },
  ];
}

export function SideMenu() {
  const pathname = usePathname() ?? "/";
  const { locale, menuOpen, setMenuOpen, role } = useApp();
  const links = menuLinks(role);

  if (!menuOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={() => setMenuOpen(false)}
        aria-label="Close menu"
      />
      <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-primary-dark text-white shadow-2xl">
        <div className="border-b border-white/10 px-5 py-6">
          <p className="text-lg font-bold">MPconnect</p>
          <p className="mt-1 text-xs text-white/70">{shellT("constituency", locale)}</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {links.map((link) => {
            const active =
              link.href === "/mp" || link.href === "/user" || link.href === "/authority"
                ? pathname === link.href
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block rounded-xl px-4 py-3 text-sm font-medium ${
                  active ? "bg-white/15" : "hover:bg-white/10"
                }`}
              >
                {shellT(link.labelKey, locale)}
              </Link>
            );
          })}
          <Link
            href="/?pick=1"
            onClick={() => setMenuOpen(false)}
            className="mt-2 block rounded-xl border border-white/20 px-4 py-3 text-sm font-medium text-white/90 hover:bg-white/10"
          >
            Switch role
          </Link>
        </nav>
        <p className="border-t border-white/10 p-4 text-[11px] text-white/50">
          Citizens speak · Data decides · Citizens confirm
        </p>
      </aside>
    </div>
  );
}
