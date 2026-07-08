"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchDemands } from "@/components/mp/api";
import { MpList } from "@/components/mp/MpList";
import { MpDemandDrawer } from "@/components/mp/MpDemandDrawer";
import type { Demand } from "@/components/mp/types";

export default function MpIssuesPage() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter") || "all";

  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const locale = "en";

  const load = async () => {
    try {
      const demandsData = await fetchDemands();
      setDemands(demandsData as any);
    } catch (err) {
      console.error("Failed to load issues demands:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredDemands = useMemo(() => {
    let list = demands;
    if (filterParam === "solved") list = demands.filter((d) => d.state === "resolved_verified");
    if (filterParam === "unsolved") list = demands.filter((d) => d.state !== "resolved_verified");
    if (filterParam === "assigned") list = demands.filter((d) => d.state !== "resolved_verified" && d.authorityId != null);
    if (filterParam === "unassigned") list = demands.filter((d) => d.state !== "resolved_verified" && d.authorityId == null);
    return list;
  }, [demands, filterParam]);

  const selectedDemand = useMemo(() => {
    return demands.find((d) => d.id === selectedId) ?? null;
  }, [demands, selectedId]);

  const triggerPrioritize = (d: Demand) => {
    alert(
      `MP Prioritize Action Triggered!\n\n1. Auto-generating MPLADS funding draft recommendation pack for "${d.title}"...\n2. Dispatching priority dispatch alert to the assigned authority.`
    );
  };

  return (
    <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 min-h-0 bg-white">
      {/* Left Column: Sorted public priority feed */}
      <div className="border-r border-slate-100 flex flex-col p-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-100 mb-4">
          Constituency Priorities Feed ({filteredDemands.length})
        </h3>
        <MpList
          demands={filteredDemands}
          loading={loading}
          locale={locale}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      {/* Right Column: Private personal aggregates */}
      <div className="p-6 bg-slate-50/50 space-y-6">
        <div>
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2">
            🔒 Personal private grievances (Anonymized summary)
          </h4>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {[
              { title: "NTR Pension Delay", count: 18 },
              { title: "Ration Renewal", count: 24 },
              { title: "Land Surveying", count: 12 },
            ].map((x) => (
              <div key={x.title} className="bg-white border rounded-2xl p-5 shadow-sm flex flex-col justify-between h-24">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{x.title}</span>
                <span className="text-2xl font-black text-slate-850 mt-1">{x.count}</span>
              </div>
            ))}
          </div>
        </div>

        {selectedDemand && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md space-y-3">
            <p className="text-xs font-semibold text-slate-700 leading-relaxed">
              Quick Command Action for: <span className="font-extrabold text-slate-950">"{selectedDemand.title}"</span>
            </p>
            <button
              onClick={() => triggerPrioritize(selectedDemand)}
              className="w-full bg-primary text-white rounded-xl py-3 text-xs font-black hover:bg-primary/95 transition-all shadow-md"
            >
              🚀 Prioritize & Generate Funding Pack
            </button>
          </div>
        )}
      </div>

      {/* MP Detail Drawer overlay */}
      <MpDemandDrawer
        demand={selectedDemand}
        open={selectedId != null}
        onClose={() => setSelectedId(null)}
        locale={locale}
      />
    </div>
  );
}
