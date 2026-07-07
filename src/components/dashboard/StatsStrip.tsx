"use client";

import { t } from "./labels";
import type { Stats } from "./types";
import type { UiLocale } from "./types";

interface StatsStripProps {
  stats: Stats | null;
  loading: boolean;
  locale: UiLocale;
}

function StatSkeleton() {
  return <div className="h-8 w-20 animate-pulse rounded bg-slate-200" />;
}

export function StatsStrip({ stats, loading, locale }: StatsStripProps) {
  return (
    <div className="grid grid-cols-2 gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:grid-cols-4">
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {t("totalDemands", locale)}
        </div>
        {loading ? (
          <StatSkeleton />
        ) : (
          <div className="text-2xl font-bold tabular-nums text-slate-900">
            {stats?.totalDemands ?? 0}
          </div>
        )}
      </div>
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {t("citizensHeard", locale)}
        </div>
        {loading ? (
          <StatSkeleton />
        ) : (
          <div className="text-2xl font-bold tabular-nums text-slate-900">
            {(stats?.citizensHeard ?? 0).toLocaleString()}
          </div>
        )}
      </div>
      <div className="col-span-2 sm:col-span-1">
        <div className="text-xs font-medium uppercase tracking-wide text-state-resolved">
          {t("verifiedRate", locale)}
        </div>
        {loading ? (
          <StatSkeleton />
        ) : (
          <div className="text-4xl font-extrabold tabular-nums text-state-resolved">
            {(stats?.verifiedResolutionRate ?? 0).toFixed(0)}%
          </div>
        )}
      </div>
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-state-reopened">
          {t("reopened", locale)}
        </div>
        {loading ? (
          <StatSkeleton />
        ) : (
          <div className="text-2xl font-bold tabular-nums text-state-reopened">
            {stats?.reopenedCount ?? 0}
          </div>
        )}
      </div>
    </div>
  );
}
