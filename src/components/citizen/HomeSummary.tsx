"use client";

interface HomeSummaryProps {
  mySubmissions: any[];
  pendingVerifications: any[];
  demandsCount: number;
  setActiveTab: (tab: any) => void;
  handleVerification: (id: number, response: "confirm" | "deny") => void;
}

export function HomeSummary({
  mySubmissions,
  pendingVerifications,
  demandsCount,
  setActiveTab,
  handleVerification,
}: HomeSummaryProps) {
  return (
    <div className="flex-1 flex flex-col md:grid md:grid-cols-2 min-h-0 overflow-hidden bg-white">
      
      {/* Left Side: Welcome and status */}
      <div className="flex flex-col border-r border-slate-100">
        <div className="p-6 bg-gradient-to-br from-slate-900 to-primary text-white space-y-4">
          <div>
            <h2 className="text-lg font-black tracking-tight">Speak & Get Resolved</h2>
            <p className="text-xs opacity-75 font-semibold leading-relaxed mt-1">
              Your direct grievance channel to the MP.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("register")}
              className="flex-1 bg-white text-primary py-2.5 rounded-xl text-xs font-extrabold hover:bg-slate-50 shadow-xs"
            >
              File New Report
            </button>
            <button
              onClick={() => setActiveTab("issues")}
              className="flex-1 bg-white/15 text-white py-2.5 rounded-xl text-xs font-extrabold hover:bg-white/25"
            >
              Public Priorities ({demandsCount})
            </button>
          </div>
        </div>

        {/* Pending Verifications */}
        {pendingVerifications.length > 0 && (
          <div className="bg-amber-50/70 border-b border-amber-200 p-6 space-y-3 shrink-0">
            <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>⚠️</span> Action Required: Confirm Fixes
            </h4>
            {pendingVerifications.map((v) => (
              <div key={v.id} className="bg-white border border-amber-200 rounded-2xl p-4 shadow-sm space-y-3">
                <p className="text-xs font-bold text-slate-800 leading-normal">
                  Is "{v.demandTitle || "Constituency Need"}" fully fixed?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleVerification(v.id, "confirm")}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2 text-xs font-bold transition-all shadow-xs"
                  >
                    Confirm Fixed
                  </button>
                  <button
                    onClick={() => handleVerification(v.id, "deny")}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-2 text-xs font-bold transition-all shadow-xs"
                  >
                    Reopen Issue
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Side: Status List */}
      <div className="p-6 space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100">
          MY REPORTS STATUS
        </h3>
        {mySubmissions.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400">
            No reports submitted yet.
          </div>
        ) : (
          mySubmissions.map((sub) => (
            <div key={sub.id} className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex justify-between items-start gap-2">
                <h4 className="font-bold text-slate-800 text-xs leading-normal">
                  {sub.summaryEn || sub.rawText}
                </h4>
                <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 uppercase shrink-0">
                  {sub.status}
                </span>
              </div>
              
              {sub.isEscalated && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-[10px] text-rose-800 font-bold leading-normal">
                  ⚠️ Escalated to GVMC Commissioner — SLA limit breached.
                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}
