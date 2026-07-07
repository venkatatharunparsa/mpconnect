"use client";

export function Toast({
  message,
  type,
  onDismiss,
}: {
  message: string;
  type: "error" | "info";
  onDismiss: () => void;
}) {
  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border px-4 py-3 text-sm shadow-lg ${
        type === "error"
          ? "border-state-reopened bg-red-50 text-red-900"
          : "border-slate-300 bg-white text-slate-800"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span>{message}</span>
        <button type="button" onClick={onDismiss} className="text-slate-500 hover:text-slate-800">
          ✕
        </button>
      </div>
    </div>
  );
}
