"use client";

import { usePathname } from "next/navigation";
import { AppProvider } from "./AppProvider";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";

const BARE_ROUTES = ["/docs"];

function mainClass(pathname: string) {
  if (pathname.startsWith("/map")) {
    return "mx-auto w-full max-w-[1600px] flex-1 px-0 pb-safe-nav lg:pb-0";
  }
  if (pathname.startsWith("/dashboard")) {
    return "mx-auto w-full max-w-[1600px] flex-1 px-0 pb-safe-nav lg:pb-6";
  }
  if (pathname.startsWith("/submit")) {
    return "mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-safe-nav sm:px-6 lg:pb-8";
  }
  return "mx-auto w-full max-w-3xl flex-1 px-4 pb-safe-nav sm:px-6 lg:max-w-5xl lg:px-8 lg:pb-10";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const bare = BARE_ROUTES.some((r) => pathname.startsWith(r));

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
