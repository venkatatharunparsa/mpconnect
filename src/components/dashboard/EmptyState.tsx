"use client";

import { t } from "./labels";
import type { UiLocale } from "./types";

export function EmptyDemandState({ locale }: { locale: UiLocale }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
        📍
      </div>
      <h3 className="text-lg font-semibold text-slate-800">{t("noDemands", locale)}</h3>
      <p className="mt-1 max-w-xs text-sm text-slate-500">{t("noDemandsHint", locale)}</p>
    </div>
  );
}
