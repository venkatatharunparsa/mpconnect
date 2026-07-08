"use client";

import Link from "next/link";
import { useApp } from "./AppProvider";
import { shellT } from "./labels";

const LINKS = [
  { href: "/dashboard", labelKey: "menuMpDashboard" as const },
  { href: "/review", labelKey: "menuReview" as const },
  { href: "/voice", labelKey: "menuVoice" as const },
  { href: "/vision", labelKey: "menuVision" as const },
  { href: "/docs", labelKey: "menuVision" as const },
];

export function SideMenu() {
  const { locale, menuOpen, setMenuOpen } = useApp();

  if (!menuOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
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
          <p className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
            {shellT("citizen", locale)}
          </p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-white/10"
            >
              {shellT(link.labelKey, locale)}
            </Link>
          ))}
        </nav>
        <p className="border-t border-white/10 p-4 text-[11px] text-white/50">
          Citizens speak · Data decides · Citizens confirm
        </p>
      </aside>
    </div>
  );
}
