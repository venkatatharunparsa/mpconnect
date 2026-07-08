"use client";

interface StatTilesProps {
  loading: boolean;
  stats: {
    total: number;
    solved: number;
    unsolved: number;
    assigned: number;
    unassigned: number;
    verifiedResolutionRate: number;
    reopenedCount: number;
  };
  statFilter: string;
  setStatFilter: (filter: any) => void;
  setActiveTab: (tab: any) => void;
}

export function StatTiles({ loading, stats, statFilter, setStatFilter, setActiveTab }: StatTilesProps) {
  return (
    <div className="flex flex-col">
      {/* Clickable stat cards */}
      <div className="p-6 grid grid-cols-2 gap-3 bg-slate-50/50">
        {[
          { id: "all", label: "Total Demands", value: stats.total, color: "border-slate-200 bg-white" },
          { id: "solved", label: "Verified Resolved", value: stats.solved, color: "border-emerald-100 bg-emerald-50 text-emerald-800" },
          { id: "assigned", label: "Assigned Out", value: stats.assigned, color: "border-blue-100 bg-blue-50 text-blue-800" },
          { id: "unassigned", label: "Unassigned Queue", value: stats.unassigned, color: "border-rose-100 bg-rose-50 text-rose-800" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setStatFilter(item.id as any);
              setActiveTab("issues");
            }}
            className={`text-left rounded-2xl border p-5 shadow-sm transition-all bg-white hover:scale-[1.01] ${item.color}`}
          >
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{item.label}</p>
            <p className="text-2xl font-black mt-2 tabular-nums">{loading ? "—" : item.value}</p>
          </button>
        ))}
      </div>

      {/* Secondary Honesty Numbers */}
      <div className="p-6 grid grid-cols-2 gap-4 border-t border-slate-100 bg-white">
        <div className="bg-slate-50 border rounded-2xl p-4 text-center">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verified Resolution Rate</span>
          <p className="text-xl font-black text-slate-800 mt-1">{stats.verifiedResolutionRate.toFixed(0)}%</p>
        </div>
        <div className="bg-slate-50 border rounded-2xl p-4 text-center">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">False Closures Reopened</span>
          <p className="text-xl font-black text-red-600 mt-1">{stats.reopenedCount}</p>
        </div>
      </div>
    </div>
  );
}
