"use client";

import { apiFetch } from "@/lib/api-client";
import { useEffect, useState } from "react";
import type { ChainVerification, TimelineEvent } from "./timeline/types";

const MODEL_EVENTS = new Set([
  "ExtractionRecorded",
  "RoutingProposed",
  "MergeProposed",
  "RankingComputed",
  "NarrativeGenerated",
]);

const HUMAN_EVENTS = new Set([
  "RoutingApproved",
  "ValidationApproved",
  "MergeApproved",
  "MergeRejected",
  "RoutingOverride",
]);

const VERIFICATION_CONFIRMED = new Set(["VerificationConfirmed"]);
const VERIFICATION_DENIED = new Set([
  "VerificationDenied",
  "DemandReopened",
  "ProblemReopened",
]);

const CITIZEN_EVENTS = new Set([
  "SubmissionReceived",
  "MergedIntoDemand",
  "DemandCreated",
  "SupportMarked",
]);

function isModelEvent(event: TimelineEvent): boolean {
  return event.actorType === "model" || MODEL_EVENTS.has(event.eventType);
}

function isHumanEvent(event: TimelineEvent): boolean {
  return event.actorType === "human" || HUMAN_EVENTS.has(event.eventType);
}

function isCitizenEvent(event: TimelineEvent): boolean {
  return event.actorType === "citizen" || CITIZEN_EVENTS.has(event.eventType);
}

function isStateChange(event: TimelineEvent): boolean {
  const p = event.payload;
  return typeof p.fromState === "string" && typeof p.toState === "string";
}

function formatActor(event: TimelineEvent, publicSafe: boolean): string {
  if (publicSafe) {
    if (event.actorType === "citizen") return "A citizen";
    if (event.actorType === "human") return "An official";
    if (event.actorType === "model") return "System";
    return "System";
  }
  const id =
    /^\d{10,}$/.test(event.actorId) || event.actorId.includes("+")
      ? "Citizen (redacted)"
      : event.actorId;
  return `${event.actorType}: ${id}`;
}

function eventLabel(eventType: string): string {
  return eventType.replace(/([A-Z])/g, " $1").trim();
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

interface TimelineProps {
  demandId: string;
  events?: TimelineEvent[];
  publicSafe?: boolean;
}

type ChainStatus = "loading" | "verified" | "broken" | "unavailable";

async function fetchChainStatus(demandId: string): Promise<ChainVerification | null> {
  try {
    const res = await apiFetch(`/api/demands/${demandId}/verify-chain`);
    if (!res.ok) return null;
    return (await res.json()) as ChainVerification;
  } catch {
    return null;
  }
}

function ChainBadge({ status, brokenAt }: { status: ChainStatus; brokenAt?: number }) {
  if (status === "loading") {
    return <div className="mb-4 h-8 animate-pulse rounded-lg bg-slate-100" />;
  }
  if (status === "unavailable") {
    return (
      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
        Chain verification unavailable (API pending)
      </div>
    );
  }
  if (status === "broken") {
    return (
      <div className="mb-4 rounded-lg border border-state-reopened bg-red-50 px-3 py-2 text-sm font-medium text-state-reopened">
        Chain broken {brokenAt != null ? `at event #${brokenAt}` : ""}
      </div>
    );
  }
  return (
    <div className="mb-4 rounded-lg border border-state-resolved bg-green-50 px-3 py-2 text-sm font-semibold text-state-resolved">
      Chain verified âœ“
    </div>
  );
}

function VerificationOutcome({ event }: { event: TimelineEvent }) {
  const confirmed = VERIFICATION_CONFIRMED.has(event.eventType);
  return (
    <div
      className={`rounded-xl border-2 p-5 ${
        confirmed
          ? "border-state-resolved bg-green-50"
          : "border-state-reopened bg-red-50"
      }`}
    >
      <div className={`text-5xl ${confirmed ? "text-state-resolved" : "text-state-reopened"}`}>
        {confirmed ? "âœ“" : "ðŸš©"}
      </div>
      <p
        className={`mt-2 text-lg font-bold ${
          confirmed ? "text-green-900" : "text-red-900"
        }`}
      >
        {confirmed
          ? "Citizen verified â€” fix confirmed"
          : "Citizen denied closure â€” publicly reopened"}
      </p>
      <p className="mt-1 text-sm text-slate-600">{eventLabel(event.eventType)}</p>
      {typeof event.payload.note === "string" && (
        <p className="mt-2 text-sm text-slate-700">{event.payload.note}</p>
      )}
      <time className="mt-2 block text-xs text-slate-500">{formatTime(event.occurredAt)}</time>
    </div>
  );
}

function StateChangeEvent({ event }: { event: TimelineEvent }) {
  const from = String(event.payload.fromState);
  const to = String(event.payload.toState);
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">State change</p>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold">
        <span className="rounded bg-slate-100 px-2 py-0.5 capitalize">{from.replace(/_/g, " ")}</span>
        <span className="text-slate-400">â†’</span>
        <span className="rounded bg-primary/10 px-2 py-0.5 capitalize text-primary">
          {to.replace(/_/g, " ")}
        </span>
      </div>
      <time className="mt-2 block text-xs text-slate-500">{formatTime(event.occurredAt)}</time>
    </div>
  );
}

function CitizenSubmissionEvent({
  event,
  publicSafe,
}: {
  event: TimelineEvent;
  publicSafe: boolean;
}) {
  const mediaUrl = event.payload.mediaUrl as string | undefined;
  const audioUrl = event.payload.audioUrl as string | undefined;
  const summary =
    (event.payload.summaryEn as string | undefined) ??
    (event.payload.summary as string | undefined);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-sm font-medium text-slate-800">
        {formatActor(event, publicSafe)} â€” {eventLabel(event.eventType)}
      </p>
      {summary && <p className="mt-1 text-sm text-slate-600">{summary}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {mediaUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl}
            alt="Citizen submission"
            className="h-16 w-16 rounded-md border border-slate-200 object-cover"
          />
        )}
        {audioUrl && (
          <audio controls src={audioUrl} className="h-10 max-w-full" preload="none">
            Voice note
          </audio>
        )}
      </div>
      <time className="mt-2 block text-xs text-slate-500">{formatTime(event.occurredAt)}</time>
    </div>
  );
}

function HumanDecisionEvent({ event, publicSafe }: { event: TimelineEvent; publicSafe: boolean }) {
  return (
    <div className="border-l-4 border-primary py-1 pl-3">
      <p className="text-sm font-bold text-slate-900">
        {formatActor(event, publicSafe)} â€” {eventLabel(event.eventType)}
      </p>
      {typeof event.payload.note === "string" && (
        <p className="mt-1 text-sm text-slate-700">{event.payload.note}</p>
      )}
      {typeof event.payload.authorityName === "string" && (
        <p className="mt-1 text-sm text-slate-600">â†’ {event.payload.authorityName}</p>
      )}
      <time className="mt-1 block text-xs text-slate-500">{formatTime(event.occurredAt)}</time>
    </div>
  );
}

function ModelDecisionEvent({ event }: { event: TimelineEvent }) {
  return (
    <div className="py-0.5 pl-2 text-xs text-slate-400">
      <span className="italic">{eventLabel(event.eventType)}</span>
      {typeof event.payload.score === "number" && (
        <span className="ml-1 tabular-nums">(score {event.payload.score})</span>
      )}
      <time className="ml-2 text-slate-300">{formatTime(event.occurredAt)}</time>
    </div>
  );
}

function DefaultEvent({ event, publicSafe }: { event: TimelineEvent; publicSafe: boolean }) {
  return (
    <div className="rounded border border-slate-100 bg-slate-50 p-2 text-sm text-slate-700">
      <span className="font-medium">{eventLabel(event.eventType)}</span>
      <span className="ml-2 text-slate-500">{formatActor(event, publicSafe)}</span>
      <time className="ml-2 text-xs text-slate-400">{formatTime(event.occurredAt)}</time>
    </div>
  );
}

function EventNode({ event, publicSafe }: { event: TimelineEvent; publicSafe: boolean }) {
  if (VERIFICATION_CONFIRMED.has(event.eventType) || VERIFICATION_DENIED.has(event.eventType)) {
    return <VerificationOutcome event={event} />;
  }
  if (isStateChange(event)) return <StateChangeEvent event={event} />;
  if (isCitizenEvent(event)) return <CitizenSubmissionEvent event={event} publicSafe={publicSafe} />;
  if (isHumanEvent(event)) return <HumanDecisionEvent event={event} publicSafe={publicSafe} />;
  if (isModelEvent(event)) return <ModelDecisionEvent event={event} />;
  return <DefaultEvent event={event} publicSafe={publicSafe} />;
}

export function Timeline({ demandId, events: eventsProp, publicSafe = false }: TimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>(eventsProp ?? []);
  const [loading, setLoading] = useState(!eventsProp);
  const [chainStatus, setChainStatus] = useState<ChainStatus>("loading");
  const [brokenAt, setBrokenAt] = useState<number | undefined>();

  useEffect(() => {
    if (eventsProp) {
      setEvents(eventsProp);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      // TODO: confirm shape with A â€” timeline may come from GET /api/demands/[id]
      try {
        const res = await apiFetch(`/api/demands/${demandId}`);
        if (res.ok) {
          const data = await res.json();
          const list: TimelineEvent[] = data.timeline ?? data.events ?? [];
          if (!cancelled) setEvents(list);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [demandId, eventsProp]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setChainStatus("loading");
      const result = await fetchChainStatus(demandId);
      if (cancelled) return;
      if (result == null) {
        setChainStatus("unavailable");
        return;
      }
      if (result.ok) {
        setChainStatus("verified");
      } else {
        setChainStatus("broken");
        setBrokenAt(result.brokenAtEventId);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [demandId]);

  // Oldest-first: read the story as it unfolded (genesis â†’ present).
  const sorted = [...events].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <div className="h-8 animate-pulse rounded-lg bg-slate-100" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <ChainBadge status={chainStatus} brokenAt={brokenAt} />
      {sorted.length === 0 ? (
        <p className="text-sm text-slate-500">No events recorded yet.</p>
      ) : (
        <ol className="relative space-y-4 border-l-2 border-slate-200 pl-4">
          {sorted.map((event) => (
            <li key={event.id} className="relative">
              <span className="absolute -left-[1.3rem] top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-300" />
              <EventNode event={event} publicSafe={publicSafe} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}