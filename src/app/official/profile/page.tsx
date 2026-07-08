"use client";

export default function OfficialProfilePage() {
  return (
    <div className="max-w-xl mx-auto p-8 space-y-6 bg-white my-8 rounded-3xl shadow-sm border border-slate-200/60">
      <div className="flex items-center gap-4">
        <span className="text-4xl p-4 bg-primary/10 rounded-2xl">👤</span>
        <div>
          <h3 className="text-base font-black text-slate-900 tracking-tight">Authority Account</h3>
          <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">Visakhapatnam GVMC Office</p>
        </div>
      </div>
    </div>
  );
}
