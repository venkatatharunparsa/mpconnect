"use client";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface LiveFeedProps {
  events: any[];
}

export function LiveFeed({ events }: LiveFeedProps) {
  return (
    <div className="flex flex-col p-6 bg-slate-50/30 h-full">
      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 pb-3 border-b border-slate-100">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
        Constituency live activity stream
      </h3>

      <div className="flex-1 overflow-y-auto mt-4 space-y-3">
        {events.map((evt) => (
          <div
            key={evt.id}
            className="bg-white border border-slate-200/50 rounded-2xl p-4 flex items-start gap-4 shadow-sm"
          >
            <span className="text-xl p-2 bg-slate-50 rounded-xl">
              {evt.eventType.includes("Received") ? "📣" : evt.eventType.includes("Resolved") ? "✅" : "⚙️"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 leading-snug">
                {evt.eventType.replace(/([A-Z])/g, " $1").trim()}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 font-bold">
                {timeAgo(evt.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
