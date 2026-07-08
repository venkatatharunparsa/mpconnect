"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchDemands } from "@/components/dashboard/api";
import type { Demand } from "@/components/dashboard/types";
import { useApp } from "@/components/shell/AppProvider";

type FeedItem = Pick<Demand, "id" | "title" | "category" | "state" | "updatedAt">;

function formatUpdatedAt(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export function LiveFeed() {
  const { locale } = useApp();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const demands = await fetchDemands();
      if (cancelled) return;

      const feed = [...demands]
        .filter((d) => d.updatedAt || d.createdAt)
        .sort((a, b) => {
          const au = a.updatedAt ?? a.createdAt ?? "";
          const bu = b.updatedAt ?? b.createdAt ?? "";
          return bu.localeCompare(au);
        })
        .slice(0, 12)
        .map((d) => ({
          id: d.id,
          title: d.title,
          category: d.category,
          state: d.state,
          updatedAt: d.updatedAt ?? d.createdAt,
        }));

      setItems(feed);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const emptyText =
    locale === "te" ? "ఇప్పుడే ఎలాంటి నవీకరణలు లేవు." : "No recent updates right now.";

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-slate-100 bg-white p-4 shadow-card sm:p-6">
        <h1 className="text-lg font-bold text-slate-900">Live feed</h1>
        <p className="mt-1 text-xs text-slate-500">
          {locale === "te" ? "తాజా డిమాండ్ నవీకరణలు" : "Latest demand updates"}
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-card bg-slate-100/60" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-card border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
          {emptyText}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((it, idx) => (
            <li key={it.id}>
              <Link
                href={`/p/${it.id}`}
                className="block rounded-card border border-slate-100 bg-white p-4 shadow-card transition hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">#{idx + 1} {it.title}</p>
                    <p className="mt-1 text-xs text-slate-500 capitalize">
                      {it.category}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      {it.state}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{formatUpdatedAt(it.updatedAt)}</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

