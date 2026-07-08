"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LangToggleLight } from "@/components/shell/LangToggle";
import { useApp, type AppRole } from "@/components/shell/AppProvider";

function dashboardHref(role: AppRole): string {
  if (role === "citizen") return "/user";
  if (role === "official") return "/authority";
  return "/mp";
}

const ROLE_CARDS: {
  role: AppRole;
  title: string;
  subtitle: string;
  emoji: string;
}[] = [
  {
    role: "mp",
    title: "Login as MP",
    subtitle: "Constituency command view with ranked public priorities.",
    emoji: "🏛️",
  },
  {
    role: "official",
    title: "Login as Authority",
    subtitle: "Execution workspace for assigned issues and updates.",
    emoji: "🗂️",
  },
  {
    role: "citizen",
    title: "Login as User",
    subtitle: "Report a problem, track status, and support public demands.",
    emoji: "🎙️",
  },
];

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role, setRole } = useApp();

  useEffect(() => {
    if (searchParams.get("pick") === "1") return;
    if (typeof window === "undefined") return;
    const storedRole = localStorage.getItem("mpconnect:role");
    if (storedRole === "citizen" || storedRole === "official" || storedRole === "mp") {
      router.replace(dashboardHref(storedRole));
    }
  }, [router, searchParams]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center bg-surface px-4 py-8 sm:px-6">
      <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary/70">
              MPconnect
            </p>
            <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Choose your role</h1>
          </div>
          <LangToggleLight />
        </div>
        <p className="mb-5 text-sm text-slate-600">
          This demo skips password login. Pick a role to open the correct dashboard flow.
        </p>

        <div className="space-y-3">
          {ROLE_CARDS.map((item) => (
            <button
              key={item.role}
              type="button"
              onClick={() => {
                setRole(item.role);
                router.push(dashboardHref(item.role));
              }}
              className={`w-full rounded-xl border p-4 text-left transition-colors ${
                role === item.role
                  ? "border-primary bg-primary/5"
                  : "border-slate-200 hover:border-primary/40 hover:bg-slate-50"
              }`}
            >
              <p className="text-sm font-bold text-slate-900">
                <span className="mr-2">{item.emoji}</span>
                {item.title}
              </p>
              <p className="mt-1 text-xs text-slate-500">{item.subtitle}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
