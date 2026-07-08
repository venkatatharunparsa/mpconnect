"use client";

export default function MpProfilePage() {
  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6 bg-white my-8 rounded-3xl shadow-sm border border-slate-200/60">
      <div className="flex items-center gap-6">
        <span className="text-5xl p-5 bg-primary/10 rounded-3xl">👤</span>
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Shri M. Sribharat</h3>
          <p className="text-xs text-slate-400 font-extrabold uppercase mt-0.5">MP Visakhapatnam Constituency</p>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-6 space-y-4 text-xs text-slate-65px leading-relaxed font-medium">
        <p>
          <strong>Constituency Focus:</strong> Overseeing state educational infrastructure improvements, GVMC clean water grids, and ward-level grievance redressal.
        </p>
      </div>
    </div>
  );
}
