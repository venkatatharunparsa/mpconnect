"use client";

export default function OfficialMapPage() {
  return (
    <div className="max-w-md mx-auto p-8 text-center space-y-6 my-12 bg-white rounded-3xl border shadow-sm">
      <span className="text-5xl">🗺️</span>
      <div className="space-y-2">
        <h3 className="text-base font-black text-slate-950">Map Scoped view</h3>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Map and zone boundaries scoped to municipality divisions.
        </p>
      </div>
    </div>
  );
}
