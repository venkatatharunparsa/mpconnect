"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthority } from "@/components/authority/AuthorityContext";
import { useApp } from "@/components/shell/AppProvider";

const t = {
  en: {
    title: "Choose your department",
    subtitle: "Select the authority you represent. Your workspace and map will be scoped to this department.",
    search: "Search departments…",
    continue: "Continue",
    verified: "Verified registry",
    noMatch: "No departments match your search.",
    loading: "Loading authorities…",
  },
  te: {
    title: "మీ డిపార్ట్‌మెంట్ ఎంచుకోండి",
    subtitle: "మీరు ప్రతినిధిస్తున్న అధికారాన్ని ఎంచుకోండి. వర్క్‌స్పేస్ మరియు మ్యాప్ ఈ డిపార్ట్‌మెంట్‌కు పరిమితం చేయబడతాయి.",
    search: "డిపార్ట్‌మెంట్లు వెతకండి…",
    continue: "కొనసాగించండి",
    verified: "ధృవీకరించబడిన రిజిస్ట్రీ",
    noMatch: "మీ శోధనకు సరిపోయే డిపార్ట్‌మెంట్లు లేవు.",
    loading: "అధికారులు లోడ్ అవుతున్నారు…",
  },
};

export function AuthorityPicker() {
  const router = useRouter();
  const { locale } = useApp();
  const { authorities, loading, setAuthorityId } = useAuthority();
  const copy = locale === "te" ? t.te : t.en;

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return authorities;
    return authorities.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.org.toLowerCase().includes(q) ||
        a.level.toLowerCase().includes(q),
    );
  }, [authorities, query]);

  return (
    <div className="mx-auto min-h-dvh max-w-2xl bg-surface px-4 py-8 pb-safe-nav">
      <div className="rounded-3xl border border-outline-variant/60 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <span className="material-symbols-outlined text-4xl text-authority-indigo">domain</span>
          <h1 className="mt-3 text-2xl font-extrabold text-on-surface">{copy.title}</h1>
          <p className="mt-2 text-sm text-on-surface-variant">{copy.subtitle}</p>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-widest text-authority-indigo/80">
            {copy.verified}
          </p>
        </div>

        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={copy.search}
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 pl-10 pr-4 text-sm outline-none ring-authority-indigo/30 focus:ring-2"
          />
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">{copy.loading}</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-on-surface-variant">{copy.noMatch}</p>
        ) : (
          <div className="max-h-[50vh] space-y-2 overflow-y-auto">
            {filtered.map((auth) => {
              const isSelected = selected === auth.id;
              return (
                <button
                  key={auth.id}
                  type="button"
                  onClick={() => setSelected(auth.id)}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                    isSelected
                      ? "border-authority-indigo bg-indigo-50/60 shadow-sm"
                      : "border-outline-variant/60 bg-white hover:border-authority-indigo/40"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined mt-0.5 rounded-xl p-2 ${
                      isSelected ? "bg-authority-indigo text-white" : "bg-surface-container-high text-authority-indigo"
                    }`}
                  >
                    apartment
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-on-surface">{auth.name}</p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">{auth.org} · {auth.level}</p>
                    {auth.categories.length > 0 && (
                      <p className="mt-2 text-[10px] font-medium text-slate-500">
                        {auth.categories.slice(0, 3).join(" · ")}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <span className="material-symbols-outlined text-authority-indigo">check_circle</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          disabled={!selected}
          onClick={() => {
            if (!selected) return;
            setAuthorityId(selected);
            router.push("/authority");
          }}
          className="mt-6 w-full rounded-xl bg-authority-indigo py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copy.continue}
        </button>
      </div>
    </div>
  );
}
