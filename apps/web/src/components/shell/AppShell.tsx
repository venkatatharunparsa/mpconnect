"use client";

import { usePathname } from "next/navigation";
import { AppProvider } from "./AppProvider";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";

const BARE_PREFIXES = ["/docs"];

function mainClass(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.includes("map")) {
    return "mx-auto w-full max-w-[1600px] flex-1 px-0 pb-safe-nav lg:pb-0";
  }
  if (segments.includes("dashboard") || segments.includes("mp") || segments.includes("authority") || segments.includes("user")) {
    return "mx-auto w-full max-w-[1600px] flex-1 px-0 pb-safe-nav lg:pb-6";
  }
  if (pathname.startsWith("/submit") || pathname.includes("/register") || pathname.endsWith("/register")) {
    return "mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-safe-nav sm:px-6 lg:pb-8";
  }
  return "mx-auto w-full max-w-3xl flex-1 px-4 pb-safe-nav sm:px-6 lg:max-w-5xl lg:px-8 lg:pb-10";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const bare = pathname === "/" || BARE_PREFIXES.some((r) => pathname.startsWith(r));

  if (bare) {
    return <AppProvider>{children}</AppProvider>;
  }

  return (
    <AppProvider>
      <div className="flex min-h-dvh flex-col bg-surface">
        <TopBar />
        <main className={mainClass(pathname)}>{children}</main>
        <BottomNav />
      </div>
    </AppProvider>
  );
}
