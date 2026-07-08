"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "./AppProvider";
import { DesktopNav } from "./DesktopNav";
import { LangToggle } from "./LangToggle";
import { IconBack, IconBell, IconMenu, IconMic } from "./icons";
import { shellT } from "./labels";
import { SideMenu } from "./SideMenu";

function titleForPath(pathname: string, locale: ReturnType<typeof useApp>["locale"]) {
  if (pathname === "/") return null;
  if (pathname.startsWith("/submit")) return shellT("reportIssue", locale);
  if (pathname.startsWith("/dashboard")) return shellT("constituencyOverview", locale);
  if (pathname.startsWith("/p/")) return shellT("priorities", locale);
  if (pathname.startsWith("/review")) return shellT("menuReview", locale);
  if (pathname.startsWith("/voice")) return shellT("menuVoice", locale);
  return "MPconnect";
}

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, toggleMenu } = useApp();
  const title = titleForPath(pathname, locale);
  const showBack = pathname !== "/" && !pathname.startsWith("/dashboard");
  const onHome = pathname === "/";

  return (
    <>
      <header className="sticky top-0 z-40 bg-primary text-white shadow-md">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:h-16 lg:gap-4 lg:px-8">
          {showBack ? (
            <button
              type="button"
              onClick={() => router.back()}
              className="-ml-1 rounded-full p-1.5 hover:bg-white/10 lg:hidden"
              aria-label={shellT("back", locale)}
            >
              <IconBack />
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleMenu}
              className="-ml-1 rounded-full p-1.5 hover:bg-white/10 lg:hidden"
              aria-label="Menu"
            >
              <IconMenu />
            </button>
          )}

          <div className="min-w-0 shrink-0 lg:min-w-[220px]">
            {title && !onHome ? (
              <h1 className="truncate text-sm font-bold tracking-wide lg:hidden">{title}</h1>
            ) : null}
            <Link
              href="/"
              className={`block truncate font-bold tracking-wide text-white hover:text-white/90 ${
                title && !onHome ? "hidden lg:block" : "text-sm lg:text-base"
              }`}
            >
              MPconnect · {shellT("constituencyShort", locale)}
            </Link>
          </div>

          <DesktopNav />

          <div className="ml-auto flex shrink-0 items-center gap-2 lg:gap-3">
            <LangToggle />
            <Link
              href="/submit"
              className="hidden items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-bold text-white shadow-fab transition-transform hover:scale-[1.02] lg:inline-flex"
            >
              <IconMic className="h-4 w-4" />
              {shellT("startNow", locale)}
            </Link>
            <button
              type="button"
              className="relative rounded-full p-1.5 hover:bg-white/10"
              aria-label="Notifications"
            >
              <IconBell className="h-5 w-5 opacity-90" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent" />
            </button>
          </div>
        </div>
      </header>
      <SideMenu />
    </>
  );
}
