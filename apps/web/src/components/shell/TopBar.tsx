"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "./AppProvider";
import { DesktopNav } from "./DesktopNav";
import { LangToggle } from "./LangToggle";
import { IconBack, IconMenu, IconMic } from "./icons";
import { shellT } from "./labels";
import { SideMenu } from "./SideMenu";

function dashboardHref(role: ReturnType<typeof useApp>["role"]) {
  if (role === "citizen") return "/user";
  if (role === "official") return "/authority";
  return "/mp";
}

function titleForPath(pathname: string, locale: ReturnType<typeof useApp>["locale"]) {
  if (pathname === "/") return null;
  if (pathname.includes("/profile")) return shellT("profile", locale);
  if (pathname.includes("/vision")) return shellT("visionShort", locale);
  if (pathname.includes("/feed")) return shellT("liveFeed", locale);
  if (pathname.startsWith("/submit")) return shellT("register", locale);
  if (pathname.includes("/user/issues")) return shellT("dashboard", locale);
  if (pathname.startsWith("/user")) return pathname.includes("/register") ? shellT("register", locale) : shellT("issues", locale);
  if (pathname.includes("/authority/issues")) return shellT("dashboard", locale);
  if (pathname.startsWith("/authority")) return pathname.includes("/workspace") ? shellT("workspace", locale) : shellT("issues", locale);
  if (pathname.includes("/mp/issues")) return shellT("dashboard", locale);
  if (pathname.startsWith("/mp")) return pathname.includes("/issues") ? shellT("dashboard", locale) : shellT("issues", locale);
  if (pathname.startsWith("/dashboard")) return shellT("dashboard", locale);
  if (pathname.startsWith("/map")) return shellT("map", locale);
  if (pathname.startsWith("/p/")) return shellT("issues", locale);
  if (pathname.startsWith("/review")) return shellT("menuReview", locale);
  if (pathname.startsWith("/voice")) return shellT("menuVoice", locale);
  return "MPconnect";
}

const ROOT_ROUTES = ["/", "/user", "/authority", "/mp", "/dashboard", "/map", "/vision", "/review"];

export function TopBar() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { locale, toggleMenu, role } = useApp();
  const title = titleForPath(pathname, locale);
  const onRoot = ROOT_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}?`));
  const showBack = !onRoot && !pathname.startsWith("/submit") && !pathname.includes("/register");

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

          <div className="min-w-0 shrink-0 lg:min-w-[200px]">
            {title && pathname !== "/" ? (
              <h1 className="truncate text-sm font-bold tracking-wide lg:hidden">{title}</h1>
            ) : null}
            <Link
              href={dashboardHref(role)}
              className={`block truncate font-bold tracking-wide text-white hover:text-white/90 ${
                title && pathname !== "/" ? "hidden lg:block" : "text-sm lg:text-base"
              }`}
            >
              MPconnect · {shellT("constituencyShort", locale)}
            </Link>
          </div>

          <DesktopNav />

          <div className="ml-auto flex shrink-0 items-center gap-2 lg:gap-3">
            <LangToggle />
            {role === "citizen" && (
              <Link
                href="/user/register"
                className="hidden items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-bold text-white shadow-fab transition-transform hover:scale-[1.02] lg:inline-flex"
              >
                <IconMic className="h-4 w-4" />
                {shellT("startNow", locale)}
              </Link>
            )}
          </div>
        </div>
      </header>
      <SideMenu />
    </>
  );
}
