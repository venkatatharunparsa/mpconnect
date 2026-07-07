"use client";

import { useEffect, useRef, useState } from "react";
import { getDemoCitizenKey } from "@/components/citizenIdentity";

type CallState = "idle" | "active" | "ended";

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VoiceAgent() {
  const [state, setState] = useState<CallState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [refId, setRefId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [liveApi, setLiveApi] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    fetch("/api/voice/live", { method: "OPTIONS" })
      .then((r) => setLiveApi(r.status !== 404))
      .catch(() => setLiveApi(false));
  }, []);

  useEffect(() => {
    if (state !== "active") return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [state]);

  const startCall = async () => {
    setState("active");
    setSeconds(0);
    setRefId(null);
    setStatus(
      liveApi
        ? "Gemini Live session starting…"
        : "Live API pending — push-to-talk mode. Hold the mic, describe your problem, then confirm.",
    );

    if (!liveApi) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        chunksRef.current = [];
        recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
        recorderRef.current = recorder;
        recorder.start();
      } catch {
        setStatus("Microphone permission required.");
        setState("idle");
      }
    }
  };

  const endCall = async () => {
    setState("ended");
    recorderRef.current?.stop();
    setStatus("Processing…");

    const citizenKey = getDemoCitizenKey();
    let audioUrl: string | undefined;
    if (chunksRef.current.length) {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      audioUrl = URL.createObjectURL(blob);
    }

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "voice", citizenKey, audioUrl, lang: "te" }),
      });
      if (res.ok) {
        const data = (await res.json()) as { refId?: string };
        setRefId(data.refId ?? null);
        setStatus("Your problem has been recorded.");
        return;
      }
    } catch {
      /* fall through */
    }

    // TODO: wire B's Gemini Live + extractSubmission
    const stub = `VZG-${new Date().getFullYear().toString().slice(-2)}07-${String(Math.floor(Math.random() * 99999)).padStart(5, "0")}`;
    setRefId(stub);
    setStatus("Intake API pending — demo reference generated.");
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-8">
      <h1 className="text-2xl font-bold text-primary">Voice intake line</h1>
      <p className="mt-1 text-center text-sm text-slate-600">
        Toll-free experience in your browser — Telugu-first
      </p>

      <div className="mt-10 flex h-64 w-64 flex-col items-center justify-center rounded-full bg-gradient-to-b from-primary/10 to-primary/30 shadow-inner">
        {state === "idle" && (
          <button
            type="button"
            onClick={startCall}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl text-white shadow-lg"
            aria-label="Start call"
          >
            📞
          </button>
        )}
        {state === "active" && (
          <div className="text-center">
            <p className="text-3xl font-mono font-bold text-primary">{formatTime(seconds)}</p>
            <p className="mt-2 text-sm text-slate-600">{muted ? "Muted" : "Listening…"}</p>
          </div>
        )}
        {state === "ended" && refId && (
          <div className="px-6 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-500">Reference</p>
            <p className="mt-1 text-xl font-bold text-primary">{refId}</p>
          </div>
        )}
      </div>

      {status && <p className="mt-6 max-w-sm text-center text-sm text-slate-600">{status}</p>}

      {state === "active" && (
        <div className="mt-8 flex gap-4">
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="rounded-full border border-slate-300 px-5 py-2 text-sm"
          >
            {muted ? "Unmute" : "Mute"}
          </button>
          <button
            type="button"
            onClick={endCall}
            className="rounded-full bg-state-reopened px-5 py-2 text-sm font-semibold text-white"
          >
            End call
          </button>
        </div>
      )}

      {state === "ended" && (
        <button
          type="button"
          onClick={() => {
            setState("idle");
            setStatus("");
            setRefId(null);
          }}
          className="mt-6 text-sm text-primary underline"
        >
          Call again
        </button>
      )}

      <p className="mt-10 max-w-sm text-center text-xs text-slate-400">
        Production path: Exotel toll-free adapter (socketed). Gemini Live API wires in via Person
        B.
      </p>
    </div>
  );
}
