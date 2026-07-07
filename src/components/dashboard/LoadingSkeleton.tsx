"use client";

import { t } from "./labels";
import type { UiLocale } from "./types";

export function DemandListSkeleton({ locale }: { locale: UiLocale }) {
  return (
    <div className="space-y-3 p-4" aria-busy="true" aria-label={t("loading", locale)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg border border-slate-200 p-4">
          <div className="h-4 w-3/4 rounded bg-slate-200" />
          <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
          <div className="mt-3 h-2 w-full rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="flex h-full items-center justify-center bg-slate-100 animate-pulse">
      <div className="h-12 w-12 rounded-full border-4 border-slate-300 border-t-primary" />
    </div>
  );
}
