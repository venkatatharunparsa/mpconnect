"use client";

import { apiFetch } from "@/lib/api-client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getDemoCitizenKey } from "@/components/citizenIdentity";
import { type ChatMessage, type SubmitLocale, t } from "./labels";

const REF_PATTERN = /^VZG-\d{4}-\d+$/i;

async function submitIntake(body: Record<string, unknown>) {
  try {
    const res = await apiFetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as {
      refId?: string;
      summary?: string;
      flags?: { reason?: string };
    };
  } catch {
    return null;
  }
}

async function lookupRef(refId: string) {
  try {
    const res = await apiFetch(`/api/submissions/${encodeURIComponent(refId)}`);
    if (!res.ok) return null;
    return (await res.json()) as { status?: string; demandId?: string };
  } catch {
    return null;
  }
}

function RefChip({ text }: { text: string }) {
  const match = text.match(/(VZG-\d{4}-\d+)/i);
  if (!match) return <p className="whitespace-pre-wrap leading-relaxed">{text}</p>;
  const [before, after] = text.split(match[0]);
  return (
    <p className="whitespace-pre-wrap leading-relaxed">
      {before}
      <span className="mt-1 inline-block rounded bg-white/90 px-2 py-0.5 font-mono text-xs font-bold text-primary shadow-sm">
        {match[0].toUpperCase()}
      </span>
      {after}
    </p>
  );
}

export function SubmitChat() {
  const [locale, setLocale] = useState<SubmitLocale>("en");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [citizenKey, setCitizenKey] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setCitizenKey(getDemoCitizenKey());
    setMessages([{ id: "safety", role: "bot", text: t("safety", "en") }]);
  }, []);

  useEffect(() => {
    setMessages((m) =>
      m.map((msg) => (msg.id === "safety" ? { ...msg, text: t("safety", locale) } : msg)),
    );
  }, [locale]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addBot = useCallback((botText: string) => {
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "bot", text: botText }]);
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setText("");
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text: trimmed }]);
    setSending(true);

    if (REF_PATTERN.test(trimmed)) {
      addBot(t("refLookup", locale));
      const status = await lookupRef(trimmed.toUpperCase());
      addBot(
        status
          ? `Status: ${status.status ?? "unknown"}${status.demandId ? ` Â· demand ${status.demandId}` : ""}`
          : `Ref ${trimmed.toUpperCase()} â€” lookup API pending.`,
      );
      setSending(false);
      return;
    }

    addBot(t("thinking", locale));
    const result = await submitIntake({
      channel: "web",
      citizenKey,
      rawText: trimmed,
      lang: locale,
    });

    if (result?.refId) {
      const rateCap =
        result.flags?.reason === "rate_cap" ? `\n\n${t("rateCapReview", locale)}` : "";
      addBot(
        locale === "te"
          ? `à°®à±€ à°¸à°®à°¸à±à°¯ à°¨à°®à±‹à°¦à±ˆà°‚à°¦à°¿.\nRef: ${result.refId}${rateCap}`
          : `Recorded.\nRef: ${result.refId}${rateCap}`,
      );
    } else {
      const stubRef = `VZG-${new Date().getFullYear().toString().slice(-2)}07-${String(Math.floor(Math.random() * 99999)).padStart(5, "0")}`;
      addBot(`${t("apiPending", locale)}\nStub ref: ${stubRef}`);
    }
    setSending(false);
  }, [text, sending, locale, citizenKey, addBot]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setMessages((m) => [
          ...m,
          { id: crypto.randomUUID(), role: "user", text: "ðŸŽ¤ Voice note", audioUrl: url },
        ]);
        setSending(true);
        addBot(t("thinking", locale));
        const result = await submitIntake({
          channel: "web",
          citizenKey,
          audioUrl: url,
          lang: locale,
        });
        if (result?.refId) {
          addBot(`Voice received.\nRef: ${result.refId}`);
        } else {
          addBot(`${t("apiPending", locale)} Voice captured locally.`);
        }
        setSending(false);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      addBot("Microphone permission needed to record a voice note.");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "user", text: "ðŸ“· Photo", mediaUrl: url },
    ]);
    e.target.value = "";
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col shadow-2xl sm:my-2 sm:h-[calc(100%-1rem)] sm:rounded-2xl sm:border sm:border-slate-300">
      {/* Chat header */}
      <header className="flex shrink-0 items-center justify-between rounded-t-2xl bg-primary px-4 py-3 text-white sm:rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
            MP
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">{t("title", locale)}</h1>
            <p className="text-xs text-white/80">
              {t("demoIdentity", locale)} Â· {citizenKey.slice(0, 10)}â€¦
            </p>
          </div>
        </div>
        <div className="flex overflow-hidden rounded-full bg-white/15 text-xs font-medium">
          {(["en", "te"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLocale(l)}
              className={`px-3 py-1.5 transition-colors ${
                locale === l ? "bg-white text-primary" : "text-white hover:bg-white/10"
              }`}
            >
              {l === "en" ? "EN" : "à°¤à±†"}
            </button>
          ))}
        </div>
      </header>

      {/* Message area */}
      <div
        className="flex-1 space-y-3 overflow-y-auto px-3 py-4"
        style={{
          backgroundColor: "#e5edf5",
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(15,76,129,0.06) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                msg.role === "user"
                  ? "rounded-br-md bg-primary text-white"
                  : "rounded-bl-md border border-white/80 bg-white text-slate-800"
              }`}
            >
              <RefChip text={msg.text} />
              {msg.mediaUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={msg.mediaUrl}
                  alt="Uploaded"
                  className="mt-2 max-h-48 w-full rounded-lg object-cover"
                />
              )}
              {msg.audioUrl && (
                <audio controls src={msg.audioUrl} className="mt-2 w-full max-w-xs" />
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
              <span className="inline-flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <footer className="shrink-0 border-t border-slate-200 bg-[#f0f4f8] px-2 py-2 sm:rounded-b-2xl">
        <div className="flex items-center gap-1.5">
          <label
            title={t("photo", locale)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-lg text-slate-600 hover:bg-slate-200"
          >
            ðŸ“·
            <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
          </label>
          <button
            type="button"
            title={t("mic", locale)}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${
              recording
                ? "animate-pulse bg-red-500 text-white"
                : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            ðŸŽ¤
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={t("placeholder", locale)}
            className="min-w-0 flex-1 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg text-white disabled:opacity-40"
            aria-label={t("send", locale)}
          >
            âž¤
          </button>
        </div>
      </footer>
    </div>
  );
}