"use client";

import { useDashboard } from "./DashboardContext";
import { t } from "./labels";
import type { DemoRole } from "./types";

const ROLES: DemoRole[] = ["citizen", "official", "mp"];

const ROLE_LABEL: Record<DemoRole, "roleCitizen" | "roleOfficial" | "roleMp"> = {
  citizen: "roleCitizen",
  official: "roleOfficial",
  mp: "roleMp",
};

export function RoleSwitcher() {
  const { role, setRole, locale } = useDashboard();

  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-0.5 text-xs shadow-sm">
      {ROLES.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => setRole(r)}
          className={`rounded-full px-3 py-1 font-medium transition-colors ${
            role === r
              ? "bg-primary text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {t(ROLE_LABEL[r], locale)}
        </button>
      ))}
    </div>
  );
}

export function LocaleToggle() {
  const { locale, setLocale } = useDashboard();

  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-0.5 text-xs shadow-sm">
      {(["en", "te"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
            locale === l
              ? "bg-slate-800 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {l === "en" ? "EN" : "తె"}
        </button>
      ))}
    </div>
  );
}
