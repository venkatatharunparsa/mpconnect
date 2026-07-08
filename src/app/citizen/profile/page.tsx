"use client";

import { useEffect, useState } from "react";

export default function CitizenProfilePage() {
  const [citizenKey, setCitizenKey] = useState("DEMO-ANON");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("mpconnect_citizen_key") ?? "DEMO-ANON";
      setCitizenKey(savedKey);
    }
  }, []);

  return (
    <div className="max-w-xl mx-auto p-8 space-y-6 bg-white my-8 rounded-3xl shadow-sm border border-slate-200/60">
      <div className="flex items-center gap-4">
        <span className="text-4xl p-4 bg-primary/10 rounded-2xl">👤</span>
        <div>
          <h3 className="text-base font-black text-slate-900 tracking-tight">Citizen Profile</h3>
          <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">Key: {citizenKey}</p>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-6">
        <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest mb-3">Notification status</h4>
        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200/50 text-xs font-bold text-slate-65px">
          <span>SMS status alert notification</span>
          <span className="text-emerald-600 font-black">ENABLED</span>
        </div>
      </div>
    </div>
  );
}
