"use client";

import { apiFetch } from "@/lib/api-client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getDemoCitizenKey } from "@/components/citizenIdentity";
import { useApp } from "@/components/shell/AppProvider";
import { runExtraction, submitExtracted } from "@/lib/intake";
import { saveRecentSubmission } from "@/lib/recent-submissions";
import { t, type Lang } from "../i18n";
import { useVerificationPoll } from "../hooks/use-verifications";
import { formatStatusLines, needsLocationClarify } from "../utils/submit-utils";
import type { GeminiExtraction } from "@mpconnect/shared";
import { isValidRefIdFormat } from "@mpconnect/shared";

type Msg = {
  id: string;
  role: "user" | "bot";
  text: string;
  kind?: "safety" | "readback" | "verification" | "status";
  refId?: string;
  verificationId?: number;
  demandTitle?: string;
  showReadbackChips?: boolean;
  isHelpdeskPromo?: boolean;
  originalQuestion?: string;
};

type PendingVoice = {
  extraction: GeminiExtraction;
  rawText?: string;
};

type PendingLocation = {
  extraction: GeminiExtraction;
  rawText?: string;
  originalInput: string;
};

const SAFETY_PREFIX = "mpconnect_safety_";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function SubmitPage() {
  const { locale } = useApp();
  const lang: Lang = locale;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [citizenKey, setCitizenKey] = useState("");
  const [recording, setRecording] = useState(false);
  const [pendingVoice, setPendingVoice] = useState<PendingVoice | null>(null);
  const [pendingLocation, setPendingLocation] = useState<PendingLocation | null>(null);
  const [mode, setMode] = useState<"grievance" | "helpdesk">("grievance");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addBot = useCallback((text: string, extra?: Partial<Msg>) => {
    setMessages((m) => [...m, { id: uid(), role: "bot", text, ...extra }]);
  }, []);

  const addUser = useCallback((text: string) => {
    setMessages((m) => [...m, { id: uid(), role: "user", text }]);
  }, []);

  useEffect(() => {
    const key = getDemoCitizenKey();
    setCitizenKey(key);

    if (!localStorage.getItem(`${SAFETY_PREFIX}${key}`)) {
      addBot(t(lang, "safetyNotice"), { kind: "safety" });
      localStorage.setItem(`${SAFETY_PREFIX}${key}`, "1");
    }
  }, [addBot, lang]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useVerificationPoll(citizenKey, lang, setMessages as never);

  const finalizeSubmission = useCallback(
    async (extraction: GeminiExtraction, rawText?: string) => {
      const result = await submitExtracted({ citizenKey, rawText, extraction });
      const summary =
        lang === "te" && extraction.summaryTe ? extraction.summaryTe : extraction.summaryEn;
      let reply = t(lang, "registered", { refId: result.refId });
      if (result.flags?.reason === "rate_cap") {
        reply += `\n\n${t(lang, "rateCapReview")}`;
      }
      addBot(reply, { refId: result.refId });
      saveRecentSubmission({
        refId: result.refId,
        title: summary.slice(0, 80) || extraction.category,
        category: extraction.category,
        status: "submitted",
      });
      return { result, summary };
    },
    [addBot, citizenKey, lang],
  );

  const processExtraction = useCallback(
    async (
      extractionInput: Parameters<typeof runExtraction>[0],
      rawText?: string,
      opts?: { skipReadback?: boolean; appendContext?: string },
    ) => {
      setBusy(true);
      try {
        const result = await runExtraction(extractionInput);
        if (result.needsHuman) {
          addBot(t(lang, "extractionFailed"));
          return;
        }

        let extraction = result.extraction;
        if (opts?.appendContext && extraction.locationText) {
          extraction = {
            ...extraction,
            locationText: `${extraction.locationText}, ${opts.appendContext}`,
          };
        } else if (opts?.appendContext) {
          extraction = { ...extraction, locationText: opts.appendContext };
        }

        if (needsLocationClarify(extraction) && !pendingLocation) {
          setPendingLocation({
            extraction,
            rawText,
            originalInput: rawText ?? "",
          });
          addBot(t(lang, "locationClarify"));
          return;
        }

        const isVoice = Boolean(extractionInput.audioBase64);
        if (isVoice && !opts?.skipReadback) {
          setPendingVoice({ extraction, rawText });
          const summary =
            lang === "te" && extraction.summaryTe ? extraction.summaryTe : extraction.summaryEn;
          addBot(t(lang, "readbackPrompt", { summary }), { kind: "readback", showReadbackChips: true });
          return;
        }

        await finalizeSubmission(extraction, rawText);
      } finally {
        setBusy(false);
      }
    },
    [addBot, finalizeSubmission, lang, pendingLocation],
  );

  const lookupRefId = useCallback(
    async (refId: string) => {
      setBusy(true);
      try {
        const res = await apiFetch(`/api/submissions/${encodeURIComponent(refId)}`);
        const data = await res.json();
        if (!res.ok) {
          addBot(data.error ?? "Not found");
          return;
        }
        addBot(
          formatStatusLines(lang, (key, vars) => t(lang, key as never, vars), refId, data),
          { kind: "status", refId },
        );
      } finally {
        setBusy(false);
      }
    },
    [addBot, lang],
  );

  const handleTextSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      addUser(trimmed);
      setInput("");

      if (mode === "helpdesk") {
        setBusy(true);
        try {
          const res = await apiFetch("/api/helpdesk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: trimmed }),
          });
          const data = await res.json();
          if (res.ok) {
            addBot(data.answer);
            addBot(
              "మీరు దీనిని ఒక గ్రీవెన్స్ (ఫిర్యాదు) రూపంలో నమోదు చేయాలనుకుంటున్నారా?\n\nDo you want to file this as an official grievance?",
              { isHelpdeskPromo: true, originalQuestion: trimmed }
            );
          } else {
            addBot("క్షమించండి, సహాయ కేంద్రం సమాచారాన్ని కనుగొనలేకపోయింది.\n\nSorry, Help Desk could not retrieve information.");
          }
        } catch {
          addBot("క్షమించండి, సహాయ కేంద్రం సమాచారాన్ని కనుగొనలేకపోయింది.\n\nSorry, Help Desk could not retrieve information.");
        } finally {
          setBusy(false);
        }
        return;
      }

      if (isValidRefIdFormat(trimmed.toUpperCase())) {
        await lookupRefId(trimmed.toUpperCase());
        return;
      }

      if (pendingLocation) {
        const ctx = trimmed;
        setPendingLocation(null);
        const combined = pendingLocation.originalInput
          ? `${pendingLocation.originalInput}\nLocation: ${ctx}`
          : ctx;
        await processExtraction({ text: combined }, combined, {
          appendContext: ctx,
          skipReadback: false,
        });
        return;
      }

      if (pendingVoice) {
        if (trimmed === "1") {
          const pv = pendingVoice;
          setPendingVoice(null);
          addBot(t(lang, "readbackCorrect"));
          setBusy(true);
          try {
            await finalizeSubmission(pv.extraction, pv.rawText);
          } finally {
            setBusy(false);
          }
          return;
        }
        if (trimmed === "2") {
          setPendingVoice(null);
          addBot(t(lang, "readbackFix"));
          return;
        }
      }

      await processExtraction({ text: trimmed }, trimmed);
    },
    [
      addBot,
      addUser,
      busy,
      finalizeSubmission,
      lang,
      lookupRefId,
      pendingLocation,
      pendingVoice,
      processExtraction,
      mode,
    ],
  );

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const base64 = await blobToBase64(blob);
        addUser(`🎙️ ${t(lang, "micStop")}`);
        await processExtraction(
          { audioBase64: base64, audioMime: mimeType },
          "[voice note]",
        );
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      addBot("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handlePhoto = async (file: File) => {
    if (busy) return;
    const base64 = await blobToBase64(file);
    addUser(`📷 ${file.name}`);
    await processExtraction(
      { imageBase64: base64, imageMime: file.type || "image/jpeg", text: input || undefined },
      input || `[photo: ${file.name}]`,
    );
    setInput("");
  };

  const respondVerification = async (verificationId: number, response: "confirm" | "deny") => {
    setBusy(true);
    try {
      const res = await apiFetch(`/api/verifications/${verificationId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response, citizenKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        addBot(data.error ?? "Response failed");
        return;
      }
      addBot(
        response === "confirm"
          ? `✅ ${t(lang, "confirmFixed")}`
          : `❌ ${t(lang, "denyNotFixed")} — demand reopened.`,
      );
      setMessages((prev) => prev.filter((m) => m.verificationId !== verificationId));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-lg mx-auto bg-[#e5ddd5] rounded-lg overflow-hidden shadow-lg border border-slate-200">
      <header className="bg-primary text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-semibold text-base">{t(lang, "title")}</h1>
          <p className="text-xs opacity-80">MPconnect intake</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-white/10 rounded-full p-0.5 text-xs mr-2">
            <button
              onClick={() => setMode("grievance")}
              className={`rounded-full px-2.5 py-0.5 font-bold transition-colors ${
                mode === "grievance" ? "bg-white text-primary" : "text-white hover:bg-white/10"
              }`}
            >
              Grievance
            </button>
            <button
              onClick={() => setMode("helpdesk")}
              className={`rounded-full px-2.5 py-0.5 font-bold transition-colors ${
                mode === "helpdesk" ? "bg-white text-primary" : "text-white hover:bg-white/10"
              }`}
            >
              Helpdesk
            </button>
          </div>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
            {t(lang, "demoIdentity")}: {citizenKey.slice(-4)}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap shadow-sm ${
                m.role === "user"
                  ? "bg-[#dcf8c6] text-slate-900"
                  : m.kind === "safety"
                    ? "bg-amber-50 border border-amber-200 text-amber-900"
                    : "bg-white text-slate-800"
              }`}
            >
              {m.text}
              {m.showReadbackChips && pendingVoice && (
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleTextSend("1")}
                    className="flex-1 bg-primary text-white text-xs py-2 rounded-lg"
                  >
                    1 — {lang === "te" ? "సరి" : "Correct"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleTextSend("2")}
                    className="flex-1 bg-slate-200 text-slate-800 text-xs py-2 rounded-lg"
                  >
                    2 — {lang === "te" ? "మార్చు" : "Fix"}
                  </button>
                </div>
              )}
              {m.kind === "verification" && m.verificationId != null && (
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => respondVerification(m.verificationId!, "confirm")}
                    className="flex-1 bg-emerald-600 text-white text-xs py-2 rounded-lg"
                  >
                    {t(lang, "confirmFixed")}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => respondVerification(m.verificationId!, "deny")}
                    className="flex-1 bg-red-600 text-white text-xs py-2 rounded-lg"
                  >
                    {t(lang, "denyNotFixed")}
                  </button>
                </div>
              )}
              {m.isHelpdeskPromo && (
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setMode("grievance");
                      setInput(m.originalQuestion ?? "");
                      addBot("సమస్య నమోదు ప్రక్రియకు మార్చబడింది. దయచేసి క్రింద ఉన్న బటన్‌ను ఉపయోగించి పంపండి.\n\nSwitched to grievance reporting. Please click send to submit your question as a grievance.");
                    }}
                    className="flex-1 bg-primary text-white text-xs py-2 rounded-lg"
                  >
                    {lang === "te" ? "ఫిర్యాదుగా నమోదు చేయి" : "Yes, file grievance"}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg px-3 py-2 text-sm text-slate-500 shadow-sm">
              {t(lang, "thinking")}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <footer className="bg-[#f0f0f0] px-2 py-2 flex items-end gap-2 shrink-0 border-t border-slate-300">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handlePhoto(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="shrink-0 w-10 h-10 rounded-full bg-white border border-slate-300 text-lg"
          title={t(lang, "photo")}
        >
          📷
        </button>
        <button
          type="button"
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={recording ? stopRecording : undefined}
          onTouchStart={(e) => {
            e.preventDefault();
            startRecording();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            stopRecording();
          }}
          disabled={busy}
          className={`shrink-0 w-10 h-10 rounded-full border text-lg ${
            recording ? "bg-red-500 text-white border-red-600" : "bg-white border-slate-300"
          }`}
          title={recording ? t(lang, "micStop") : t(lang, "micStart")}
        >
          🎤
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleTextSend(input);
            }
          }}
          placeholder={mode === "helpdesk" ? "Ask eligibility question..." : t(lang, "placeholder")}
          rows={1}
          disabled={busy}
          className="flex-1 resize-none rounded-3xl border border-slate-300 px-4 py-2 text-sm max-h-24"
        />
        <button
          type="button"
          onClick={() => handleTextSend(input)}
          disabled={busy || !input.trim()}
          className="shrink-0 bg-primary text-white px-4 py-2 rounded-full text-sm font-medium disabled:opacity-40"
        >
          {t(lang, "send")}
        </button>
      </footer>
    </div>
  );
}