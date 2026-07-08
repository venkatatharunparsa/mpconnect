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

const t = {
  en: {
    title: "Choose your role",
    subtitle: "This demo skips password login. Pick a role to open the correct dashboard flow.",
    mpTitle: "Login as MP",
    mpSub: "Constituency command view with ranked public priorities.",
    authTitle: "Login as Authority",
    authSub: "Execution workspace for assigned issues and updates.",
    userTitle: "Login as User",
    userSub: "Report a problem, track status, and support public demands.",
  },
  te: {
    title: "మీ పాత్రను ఎంచుకోండి",
    subtitle: "ఈ డెమో పాస్‌వర్డ్ లాగిన్‌ను దాటవేస్తుంది. సరైన డాష్‌బోర్డ్ ఫ్లోను తెరవడానికి ఒక పాత్రను ఎంచుకోండి.",
    mpTitle: "MP గా లాగిన్ అవ్వండి",
    mpSub: "ర్యాంక్ చేయబడిన ప్రజల ప్రాధాన్యతలతో నియోజకవర్గ కమాండ్ వ్యూ.",
    authTitle: "అధికారిగా లాగిన్ అవ్వండి",
    authSub: "కేటాయించిన సమస్యలు మరియు నవీకరణల కోసం వర్క్‌స్పేస్.",
    userTitle: "వినియోగదారుడిగా లాగిన్ అవ్వండి",
    userSub: "సమస్యను నివేదించండి, స్థితిని ట్రాక్ చేయండి మరియు ప్రజల డిమాండ్లకు మద్దతు ఇవ్వండి.",
  }
};

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role, setRole, locale } = useApp();
  const isTe = locale === "te";
  const translations = isTe ? t.te : t.en;

  const roleCards = [
    {
      role: "mp" as AppRole,
      title: translations.mpTitle,
      subtitle: translations.mpSub,
      emoji: "🏛️",
    },
    {
      role: "official" as AppRole,
      title: translations.authTitle,
      subtitle: translations.authSub,
      emoji: "🗂️",
    },
    {
      role: "citizen" as AppRole,
      title: translations.userTitle,
      subtitle: translations.userSub,
      emoji: "🎙️",
    },
  ];

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
            <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{translations.title}</h1>
          </div>
          <LangToggleLight />
        </div>
        <p className="mb-5 text-sm text-slate-600">
          {translations.subtitle}
        </p>

        <div className="space-y-3">
          {roleCards.map((item) => (
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
