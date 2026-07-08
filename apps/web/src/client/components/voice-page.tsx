"use client";

import { apiFetch } from "@/lib/api-client";
import { useCallback, useEffect, useRef, useState } from "react";
import { extractVoiceTranscript, submitVoiceSubmission } from "@/lib/intake";
import type { GeminiExtraction } from "@mpconnect/shared";

type CallPhase = "idle" | "calling" | "active" | "confirming" | "done";
type CallMode = "live" | "push";

const CITIZEN_KEY_STORAGE = "mpconnect_citizen_key";

const LIVE_SYSTEM = `You are the MPconnect intake line for Visakhapatnam Lok Sabha.
Greet in Telugu. Collect only WHAT the citizen needs and WHERE (area/ward).
Then read back a one-sentence summary and ask "à°¸à°°à±ˆà°¨à°¦à±‡à°¨à°¾?" for confirmation.
Do not discuss unrelated topics.`;

function getCitizenKey(): string {
  if (typeof window === "undefined") return "demo-voice";
  let key = localStorage.getItem(CITIZEN_KEY_STORAGE);
  if (!key) {
    key = `DEMO-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    localStorage.setItem(CITIZEN_KEY_STORAGE, key);
  }
  return key;
}

function speak(text: string, lang = "te-IN") {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  window.speechSynthesis.speak(u);
}

function formatTimer(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function VoicePage() {
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [mode, setMode] = useState<CallMode | null>(null);
  const [muted, setMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [extraction, setExtraction] = useState<GeminiExtraction | null>(null);
  const [refId, setRefId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [recording, setRecording] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const liveCloseRef = useRef<(() => void) | null>(null);
  const transcriptRef = useRef("");

  useEffect(() => {
    if (phase !== "active") return;
    const iv = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(iv);
  }, [phase]);

  const endLive = useCallback(() => {
    liveCloseRef.current?.();
    liveCloseRef.current = null;
  }, []);

  const tryLiveSession = useCallback(async (): Promise<boolean> => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return false;

    try {
      const { GoogleGenAI, Modality } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      const session = await ai.live.connect({
        model: "gemini-2.0-flash-live-preview-04-09",
        config: {
          responseModalities: [Modality.AUDIO, Modality.TEXT],
          systemInstruction: LIVE_SYSTEM,
        },
        callbacks: {
          onmessage: (msg: any) => {
            const parts = msg.serverContent?.modelTurn?.parts ?? [];
            for (const p of parts) {
              if (p.text) {
                transcriptRef.current += ` ${p.text}`;
                setTranscript((t) => `${t} ${p.text}`.trim());
              }
            }
          },
          onerror: () => setStatus("Live connection error â€” switched to push-to-talk."),
        },
      });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = async (e) => {
        if (e.data.size < 100) return;
        const base64 = await blobToBase64(e.data);
        session.sendRealtimeInput({
          audio: { data: base64, mimeType },
        });
      };
      recorder.start(500);
      recorderRef.current = recorder;

      liveCloseRef.current = () => {
        recorder.stop();
        stream.getTracks().forEach((t) => t.stop());
        session.close();
      };

      setMode("live");
      setStatus("Live line connected");
      speak("à°¨à°®à°¸à±à°•à°¾à°°à°‚. MPconnect à°²à±ˆà°¨à±. à°®à±€ à°¸à°®à°¸à±à°¯ à°à°®à°¿à°Ÿà°¿, à°Žà°•à±à°•à°¡?");
      return true;
    } catch {
      return false;
    }
  }, []);

  const startPushToTalk = useCallback(async () => {
    setMode("push");
    setStatus("Push-to-talk mode");
    speak("à°¨à°®à°¸à±à°•à°¾à°°à°‚. MPconnect à°²à±ˆà°¨à±. à°®à±€ à°¸à°®à°¸à±à°¯ à°à°®à°¿à°Ÿà°¿, à°Žà°•à±à°•à°¡?");
  }, []);

  const startCall = async () => {
    setPhase("calling");
    setSeconds(0);
    setTranscript("");
    transcriptRef.current = "";
    setSummary("");
    setExtraction(null);
    setRefId(null);

    const liveOk = await tryLiveSession();
    if (!liveOk) {
      endLive();
      await startPushToTalk();
    }
    setPhase("active");
  };

  const startRecording = async () => {
    if (mode !== "push" || recording) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
    const recorder = new MediaRecorder(stream, { mimeType });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data);
    };
      recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const base64 = await blobToBase64(blob);
      setStatus("Processingâ€¦");
      const audioRes = await apiFetch("/api/voice/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64: base64, audioMime: mimeType }),
      });
      const audioResult = await audioRes.json();

      const ext = audioRes.ok ? audioResult.extraction : null;
      if (!ext) {
        setStatus("Could not understand â€” try again.");
        return;
      }
      const s = ext.summaryTe || ext.summaryEn;
      setExtraction(ext);
      setSummary(s);
      setTranscript(s);
      setPhase("confirming");
      speak(`à°®à±€ à°¸à°®à°¸à±à°¯: ${s}. à°¸à°°à±ˆà°¨à°¦à±‡à°¨à°¾?`);
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const finishCall = async () => {
    endLive();
    recorderRef.current?.stop();

    const text = transcriptRef.current.trim() || transcript.trim();
    if (!text) {
      setPhase("idle");
      return;
    }

    setStatus("Extractingâ€¦");
    const result = await extractVoiceTranscript(text);
    if (result.needsHuman) {
      setStatus("Needs human review.");
      setPhase("idle");
      return;
    }
    const ext = result.extraction;
    setExtraction(ext);
    setSummary(ext.summaryTe || ext.summaryEn);
    setPhase("confirming");
    speak(`à°®à±€ à°¸à°®à°¸à±à°¯: ${ext.summaryTe || ext.summaryEn}. à°¸à°°à±ˆà°¨à°¦à±‡à°¨à°¾?`);
  };

  const confirmSubmit = async () => {
    if (!extraction) return;
    setStatus("Submittingâ€¦");
    const result = await submitVoiceSubmission({
      citizenKey: getCitizenKey(),
      rawText: transcript || summary,
      extraction,
    });
    setRefId(result.refId);
    setPhase("done");
    const spoken = `à°®à±€ à°°à°¿à°«à°°à±†à°¨à±à°¸à± à°à°¡à°¿: ${result.refId}`;
    speak(spoken, "te-IN");
    setStatus("Registered");
  };

  return (
    <div className="max-w-md mx-auto min-h-[80vh] flex flex-col items-center justify-center gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-primary">MPconnect Voice Line</h1>
        <p className="text-sm text-slate-600 mt-1">à°¤à±‹à°²à±-à°«à±à°°à±€ à°•à°¾à°²à± à°…à°¨à±à°­à°µà°‚ Â· Visakhapatnam</p>
      </div>

      <div className="w-full bg-slate-900 text-white rounded-3xl p-8 shadow-xl flex flex-col items-center gap-6">
        {phase === "idle" && (
          <button
            type="button"
            onClick={startCall}
            className="w-28 h-28 rounded-full bg-green-500 hover:bg-green-400 text-white text-lg font-semibold shadow-lg shadow-green-500/40"
          >
            Call
          </button>
        )}

        {(phase === "calling" || phase === "active" || phase === "confirming") && (
          <>
            <p className="text-3xl font-mono tabular-nums">{formatTimer(seconds)}</p>
            <p className="text-sm text-slate-300">{status || (mode === "live" ? "Live" : "Push-to-talk")}</p>
            {transcript && (
              <p className="text-xs text-slate-400 text-center max-h-20 overflow-y-auto">{transcript}</p>
            )}
          </>
        )}

        {phase === "active" && mode === "push" && (
          <button
            type="button"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={(e) => {
              e.preventDefault();
              startRecording();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              stopRecording();
            }}
            className={`w-24 h-24 rounded-full ${recording ? "bg-red-500" : "bg-primary"} text-sm font-medium`}
          >
            {recording ? "â€¦" : "Speak"}
          </button>
        )}

        {phase === "confirming" && (
          <div className="text-center space-y-4 w-full">
            <p className="text-base">{summary}</p>
            <p className="text-teal-300 text-sm">à°¸à°°à±ˆà°¨à°¦à±‡à°¨à°¾?</p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={confirmSubmit}
                className="bg-green-500 px-6 py-2 rounded-full font-medium"
              >
                à°…à°µà±à°¨à±
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhase("active");
                  setExtraction(null);
                  speak("à°¦à°¯à°šà±‡à°¸à°¿ à°®à°³à±à°²à±€ à°šà±†à°ªà±à°ªà°‚à°¡à°¿.");
                }}
                className="bg-slate-600 px-6 py-2 rounded-full"
              >
                à°•à°¾à°¦à±
              </button>
            </div>
          </div>
        )}

        {phase === "done" && refId && (
          <div className="text-center">
            <p className="text-sm text-slate-300 mb-2">à°®à±€ à°°à°¿à°«à°°à±†à°¨à±à°¸à± à°à°¡à°¿</p>
            <p className="text-4xl font-bold tracking-wide text-green-400">{refId}</p>
          </div>
        )}

        {phase !== "idle" && phase !== "done" && (
          <div className="flex gap-8 items-center">
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              className={`w-12 h-12 rounded-full ${muted ? "bg-red-600" : "bg-slate-700"}`}
              title="Mute"
            >
              {muted ? "ðŸ”‡" : "ðŸ”Š"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (phase === "active" && mode === "live") void finishCall();
                else if (phase === "active") void finishCall();
                else setPhase("idle");
              }}
              className="w-14 h-14 rounded-full bg-red-600 text-white font-bold"
              title="End call"
            >
              âœ•
            </button>
          </div>
        )}

        {phase === "done" && (
          <button
            type="button"
            onClick={() => setPhase("idle")}
            className="text-sm text-slate-400 underline"
          >
            New call
          </button>
        )}
      </div>

      {!process.env.NEXT_PUBLIC_GEMINI_API_KEY && (
        <p className="text-xs text-slate-500 text-center max-w-sm">
          Live API unavailable â€” using push-to-talk fallback. Set NEXT_PUBLIC_GEMINI_API_KEY for Live mode.
        </p>
      )}
    </div>
  );
}