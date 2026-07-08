"use client";

export function QueueStatTiles() {
  return (
    <div className="p-6 max-w-4xl mx-auto w-full space-y-6 bg-white">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
        Resolution performance metrics
      </h3>
      <div className="grid grid-cols-3 gap-4 text-center text-xs">
        <div className="bg-slate-50 border rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-slate-400">RESOLVED</p>
          <p className="text-2xl font-black text-emerald-600 mt-2">14</p>
        </div>
        <div className="bg-slate-50 border rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-slate-400">REOPENED</p>
          <p className="text-2xl font-black text-red-500 mt-2">2</p>
        </div>
        <div className="bg-slate-50 border rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-slate-400">RATE</p>
          <p className="text-2xl font-black text-primary mt-2">87%</p>
        </div>
      </div>
    </div>
  );
}
