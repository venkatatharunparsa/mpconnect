"use client";

import { useApp } from "./AppProvider";
import { shellT } from "./labels";

export function LangToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useApp();

  return (
    <div
      className={`flex items-center rounded-full border border-white/25 bg-white/10 px-1 py-0.5 text-[11px] font-semibold text-white ${className}`}
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`rounded-full px-2 py-0.5 transition-colors ${
          locale === "en" ? "bg-white text-primary" : "text-white/90"
        }`}
      >
        ENG
      </button>
      <span className="px-0.5 text-white/50">|</span>
      <button
        type="button"
        onClick={() => setLocale("te")}
        className={`rounded-full px-2 py-0.5 transition-colors ${
          locale === "te" ? "bg-white text-primary" : "text-white/90"
        }`}
      >
        తెలుగు
      </button>
    </div>
  );
}

export function LangToggleLight() {
  const { locale, setLocale } = useApp();

  return (
    <div className="flex items-center rounded-full border border-slate-200 bg-white px-1 py-0.5 text-[11px] font-semibold shadow-sm">
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`rounded-full px-2 py-0.5 transition-colors ${
          locale === "en" ? "bg-primary text-white" : "text-slate-600"
        }`}
      >
        ENG
      </button>
      <span className="px-0.5 text-slate-300">|</span>
      <button
        type="button"
        onClick={() => setLocale("te")}
        className={`rounded-full px-2 py-0.5 transition-colors ${
          locale === "te" ? "bg-primary text-white" : "text-slate-600"
        }`}
      >
        {locale === "te" ? "తెలుగు" : "తె"}
      </button>
    </div>
  );
}
