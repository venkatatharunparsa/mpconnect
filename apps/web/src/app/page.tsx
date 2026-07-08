"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LangToggleLight } from "@/components/shell/LangToggle";
import { useApp, type AppRole } from "@/components/shell/AppProvider";

function dashboardHref(role: AppRole): string {
  if (role === "citizen") return "/user";
  if (role === "official") return "/authority/pick";
  return "/mp";
}

const t = {
  en: {
    tagline: "Report. Track. Resolve — Visakhapatnam.",
    footnote: "No password — demo environment",
    footer: "Official Portal for Visakhapatnam Constituency",
    citizen: {
      title: "Login as Citizen",
      subtitle: "Raise issues in your ward, track progress, and support local community demands.",
      cta: "Enter Portal",
    },
    official: {
      title: "Login as Authority",
      subtitle: "Review incoming demands, assign tasks, and update resolution status.",
      cta: "Admin Access",
    },
    mp: {
      title: "Login as MP",
      subtitle: "Executive overview of constituency performance and urgent priorities.",
      cta: "Member View",
    },
  },
  te: {
    tagline: "నివేదించండి. ట్రాక్ చేయండి. పరిష్కరించండి — విశాఖపట్నం.",
    footnote: "పాస్‌వర్డ్ లేదు — డెమో వాతావరణం",
    footer: "విశాఖపట్నం నియోజకవర్గ అధికారిక పోర్టల్",
    citizen: {
      title: "పౌరుడిగా లాగిన్",
      subtitle: "మీ వార్డ్‌లో సమస్యలు నివేదించండి, ప్రగతిని ట్రాక్ చేయండి.",
      cta: "పోర్టల్‌కు ప్రవేశించండి",
    },
    official: {
      title: "అధికారిగా లాగిన్",
      subtitle: "డిమాండ్లను సమీక్షించండి, పనులు కేటాయించండి, పరిష్కార స్థితిని నవీకరించండి.",
      cta: "అడ్మిన్ యాక్సెస్",
    },
    mp: {
      title: "MP గా లాగిన్",
      subtitle: "నియోజకవర్గ పనితీరు మరియు అత్యవసర ప్రాధాన్యతల అవలోకనం.",
      cta: "సభ్యుల వీక్షణ",
    },
  },
};

const ROLE_CARDS: Array<{
  role: AppRole;
  icon: string;
  watermark: string;
  accent: string;
  textAccent: string;
}> = [
  {
    role: "citizen",
    icon: "person",
    watermark: "groups",
    accent: "bg-primary-container",
    textAccent: "text-primary-container",
  },
  {
    role: "official",
    icon: "shield_person",
    watermark: "account_balance_wallet",
    accent: "bg-authority-indigo",
    textAccent: "text-authority-indigo",
  },
  {
    role: "mp",
    icon: "stars",
    watermark: "policy",
    accent: "bg-tertiary",
    textAccent: "text-tertiary",
  },
];

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setRole, locale } = useApp();
  const copy = locale === "te" ? t.te : t.en;

  useEffect(() => {
    if (searchParams.get("pick") === "1") return;
    if (typeof window === "undefined") return;
    const storedRole = localStorage.getItem("mpconnect:role");
    if (storedRole === "citizen" || storedRole === "official" || storedRole === "mp") {
      if (storedRole === "official") {
        const hasAuthority = localStorage.getItem("mpconnect:authorityId");
        router.replace(hasAuthority ? "/authority" : "/authority/pick");
      } else {
        router.replace(dashboardHref(storedRole));
      }
    }
  }, [router, searchParams]);

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-on-surface">
      <div className="fixed right-4 top-4 z-50">
        <LangToggleLight />
      </div>

      <main className="relative flex flex-grow flex-col items-center justify-center px-4 py-10">
        <div className="z-10 mb-10 text-center">
          <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            account_balance
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-primary">MPconnect</h1>
          <p className="mx-auto mt-2 max-w-md text-base text-on-surface-variant">{copy.tagline}</p>
        </div>

        <div className="z-10 grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {ROLE_CARDS.map((card) => {
            const roleCopy =
              card.role === "citizen" ? copy.citizen : card.role === "official" ? copy.official : copy.mp;
            return (
              <button
                key={card.role}
                type="button"
                onClick={() => {
                  setRole(card.role);
                  router.push(dashboardHref(card.role));
                }}
                className="role-card-hover group relative flex flex-col items-start overflow-hidden rounded-2xl glass-card p-6 text-left shadow-sm"
              >
                <div className="pointer-events-none absolute right-0 top-0 p-4 opacity-5 transition-opacity group-hover:opacity-10">
                  <span className="material-symbols-outlined text-[120px]">{card.watermark}</span>
                </div>
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${card.accent}`}>
                  <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {card.icon}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-on-surface">{roleCopy.title}</h3>
                <p className="mt-1 text-sm text-on-surface-variant">{roleCopy.subtitle}</p>
                <div className={`mt-5 flex items-center text-sm font-semibold ${card.textAccent}`}>
                  {roleCopy.cta}
                  <span className="material-symbols-outlined ml-1 text-base">arrow_forward</span>
                </div>
              </button>
            );
          })}
        </div>

        <p className="z-10 mt-10 flex items-center text-sm text-outline">
          <span className="material-symbols-outlined mr-1 text-base">info</span>
          {copy.footnote}
        </p>
      </main>

      <footer className="flex h-20 items-end justify-center bg-gradient-to-t from-surface-container-low to-transparent pb-4">
        <p className="text-center text-xs text-on-surface-variant/70">{copy.footer}</p>
      </footer>
    </div>
  );
}
