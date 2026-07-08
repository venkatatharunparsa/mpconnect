"use client";

import { BrainCircuit, Send, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type MsgRole = "assistant" | "user";

type ChatMessage = {
  id: string;
  role: MsgRole;
  text: string;
};

const SUGGESTED_PROMPTS = [
  "Top priorities this week",
  "Where to allocate MPLADS funds",
  "Wards with low resolution rate",
];

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const FALLBACK_REPLIES = [
  "Here is a prototype snapshot: safety hazards are trending up in MVP and water leakages are the top repeat grievance in Gajuwaka.",
  "Mock insight: if closure verification drops below 70% in any ward, prioritize follow-up audits before opening new works.",
  "Simulated summary: weekly momentum is positive, but unresolved high-urgency issues still need tighter department SLAs.",
];

function getMockReply(text: string) {
  const q = text.toLowerCase();
  if (q.includes("top priorities") || q.includes("priority")) {
    return [
      "Top priorities this week (mock):",
      "1) Safety hazards near schools and parks",
      "2) Water leakages in dense residential pockets",
      "3) Potholes on key commuter corridors",
    ].join("\n");
  }

  if (q.includes("mplads") || q.includes("allocate") || q.includes("fund")) {
    return [
      "MPLADS allocation draft (mock):",
      "• 45% safety + streetlight restoration",
      "• 35% water network repair and leakage control",
      "• 20% school/public health micro-infra upgrades",
    ].join("\n");
  }

  if (q.includes("ward") && (q.includes("low") || q.includes("resolution"))) {
    return [
      "Wards with low resolution rate (mock):",
      "• MVP: 58% (pending electrical and drainage closures)",
      "• Bheemili: 61% (road restoration backlog)",
      "• Gajuwaka: 64% (reopened water leakage complaints)",
    ].join("\n");
  }

  return FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
    </div>
  );
}

function Bubble({
  role,
  children,
}: {
  role: MsgRole;
  children: React.ReactNode;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mr-2 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tertiary text-white shadow-sm">
          <BrainCircuit className="h-4 w-4" />
        </div>
      )}
      <div
        className={[
          "max-w-[85%] rounded-2xl border px-3 py-2 text-sm leading-relaxed shadow-sm",
          isUser
            ? "border-purple-200 bg-purple-50 text-slate-900"
            : "border-slate-200 bg-white text-slate-900",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}

export function MPCopilotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I'm your MP Copilot. Ask me about constituency priorities, rankings, or MPLADS planning.",
    },
  ]);

  const close = () => setOpen(false);
  const toggle = () => setOpen((v) => !v);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = panelRef.current;
      if (!el) return;
      if (el.contains(e.target as Node)) return;
      close();
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages.length, typing, open]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current != null) window.clearTimeout(typingTimerRef.current);
    };
  }, []);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (typingTimerRef.current != null) window.clearTimeout(typingTimerRef.current);
    const delayMs = clamp(600 + Math.floor(Math.random() * 300), 600, 900);
    const mockReply = getMockReply(trimmed);

    setMessages((prev) => [...prev, { id: uid(), role: "user", text: trimmed }]);
    setInput("");
    setTyping(true);

    typingTimerRef.current = window.setTimeout(() => {
      setMessages((prev) => [...prev, { id: uid(), role: "assistant", text: mockReply }]);
      setTyping(false);
      typingTimerRef.current = null;
    }, delayMs);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Open MP Copilot"
        onClick={toggle}
        className={[
          "fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full",
          "bg-tertiary text-white shadow-lg ring-1 ring-purple-200/20 transition",
          "hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-300/40",
          "animate-[pulse_3.2s_ease-in-out_infinite]",
        ].join(" ")}
      >
        <BrainCircuit className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

          <div
            ref={panelRef}
            className={[
              "absolute bottom-6 right-6 flex w-[380px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl",
              "border border-slate-200 bg-white shadow-2xl",
              "opacity-100 transition",
              "sm:h-[560px] h-[calc(100vh-3rem)] sm:bottom-6 sm:right-6 sm:top-auto sm:left-auto",
              "max-sm:inset-0 max-sm:bottom-0 max-sm:right-0 max-sm:h-dvh max-sm:w-full max-sm:max-w-none max-sm:rounded-none",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-3 bg-tertiary px-4 py-3 text-white">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold">MP Copilot</p>
                  <p className="text-[11px] text-white/80">Coming soon</p>
                </div>
                <span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">
                  Prototype
                </span>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={close}
                className="rounded-lg p-2 text-white/90 hover:bg-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
              <div className="space-y-3">
                {messages.map((m) => (
                  <Bubble key={m.id} role={m.role}>
                    {m.text}
                  </Bubble>
                ))}
                {typing && (
                  <Bubble role="assistant">
                    <TypingDots />
                  </Bubble>
                )}
                <div ref={endRef} />
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white p-3">
              <div className="mb-2 flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => sendMessage(p)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:border-purple-200 hover:bg-purple-50"
                  >
                    {p}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(input);
                }}
                className="flex items-center gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message MP Copilot…"
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-purple-200/50"
                />
                <button
                  type="submit"
                  aria-label="Send"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-tertiary text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-300/40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              <p className="mt-2 text-[11px] text-slate-500">
                Prototype preview — responses are simulated.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

