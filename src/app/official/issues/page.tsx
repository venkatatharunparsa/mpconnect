"use client";

import { useEffect, useState } from "react";
import { fetchDemands } from "@/components/official/api";
import type { Demand } from "@/components/official/types";

export default function OfficialIssuesPage() {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const demandsData = await fetchDemands();
        setDemands(demandsData as any);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto w-full space-y-4 bg-white min-h-dvh">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-200">
        Public demands (View Only)
      </h3>
      {loading ? (
        <p className="text-xs text-slate-400">Loading...</p>
      ) : (
        demands.map((d) => (
          <div key={d.id} className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <h4 className="font-bold text-slate-900 text-sm">{d.title}</h4>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1.5">{d.category} · {d.ward}</p>
          </div>
        ))
      )}
    </div>
  );
}
