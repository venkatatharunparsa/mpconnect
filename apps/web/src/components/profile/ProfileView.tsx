"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Authority } from "@/components/authority/types";
import { fetchAuthorityDemands } from "@/components/authority/api";
import { computeStatsFromDemands, fetchDemands } from "@/components/dashboard/api";
import type { Demand } from "@/components/dashboard/types";
import { getDemoCitizenKey } from "@/components/citizenIdentity";
import { useApp, type AppRole } from "@/components/shell/AppProvider";
import { IconStats, IconUser } from "@/components/shell/icons";
import { loadRecentSubmissions, type RecentSubmission } from "@/lib/recent-submissions";

interface RoleMeta {
  title: string;
  subtitle: string;
  accent: string;
  chip: string;
}

const ROLE_META: Record<AppRole, RoleMeta> = {
  citizen: {
    title: "Citizen",
    subtitle: "Your voice in Visakhapatnam",
    accent: "bg-primary",
    chip: "bg-primary/10 text-primary",
  },
  official: {
    title: "Authority official",
    subtitle: "Department workspace",
    accent: "authority-gradient",
    chip: "bg-indigo-50 text-authority-indigo",
  },
  mp: {
    title: "Member of Parliament",
    subtitle: "Constituency command",
    accent: "bg-tertiary",
    chip: "bg-purple-50 text-tertiary",
  },
};

function QuickLink({ href, label, hint }: { href: string; label: string; hint: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-card border border-slate-100 bg-white px-4 py-3 shadow-card transition-colors hover:border-primary/30"
    >
      <div>
        <p className="font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>
      <span className="text-sm font-semibold text-primary">→</span>
    </Link>
  );
}

export function ProfileView({ role, authority }: { role: AppRole; authority?: Authority | null }) {
  const { locale, setLocale } = useApp();
  const meta = ROLE_META[role];
  const headerTitle = role === "official" && authority ? authority.name : meta.title;
  const headerSubtitle =
    role === "official" && authority ? `${authority.org} · ${authority.level}` : meta.subtitle;

  const [citizenKey, setCitizenKey] = useState<string>("—");
  const [demands, setDemands] = useState<Demand[]>([]);
  const [recent, setRecent] = useState<RecentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role === "citizen") {
      setCitizenKey(getDemoCitizenKey());
      setRecent(loadRecentSubmissions());
    }
    let cancelled = false;
    (async () => {
      const data =
        role === "official" && authority ? await fetchAuthorityDemands(authority) : await fetchDemands();
      if (!cancelled) {
        setDemands(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role, authority]);

  const stats = useMemo(() => computeStatsFromDemands(demands), [demands]);

  const roleStats = useMemo(() => {
    if (role === "citizen") {
      return [
        { label: "Your reports", value: recent.length },
        { label: "Community demands", value: stats.totalDemands },
      ];
    }
    if (role === "official") {
      const actionable = demands.filter((d) =>
        ["claimed", "validated_public", "routed", "in_progress", "fix_claimed"].includes(d.state),
      ).length;
      const resolved = demands.filter((d) => d.state === "resolved_verified").length;
      return [
        { label: "Actionable", value: actionable },
        { label: "Resolved", value: resolved },
      ];
    }
    return [
      { label: "Total demands", value: stats.totalDemands },
      { label: "Citizens heard", value: stats.citizensHeard },
    ];
  }, [role, demands, recent, stats]);

  const quickLinks = useMemo(() => {
    if (role === "citizen") {
      return [
        { href: "/user", label: "Home", hint: "Overview & trending" },
        { href: "/user/issues", label: "My issues", hint: "Track your submissions" },
        { href: "/user/register", label: "Report an issue", hint: "Voice, text or photo" },
      ];
    }
    if (role === "official") {
      return [
        { href: "/authority", label: "Dashboard", hint: "Your office overview" },
        { href: "/authority/workspace", label: "Workspace", hint: "Allotted issues & actions" },
        { href: "/authority/map", label: "Map", hint: "Issues in your patch" },
        { href: "/authority/pick", label: "Switch department", hint: "Log in as a different office" },
      ];
    }
    return [
      { href: "/mp", label: "Command center", hint: "Ranked priorities" },
      { href: "/mp/issues", label: "Issue queue", hint: "Triage order" },
      { href: "/mp/feed", label: "Live feed", hint: "Recent activity" },
    ];
  }, [role]);

  return (
    <div className="mx-auto w-full max-w-2xl py-5 sm:py-6 lg:py-8">
      <section className="overflow-hidden rounded-card border border-slate-100 bg-white shadow-card">
        <div className={`flex items-center gap-4 ${meta.accent} p-5 text-white`}>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <IconUser className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-extrabold leading-tight">{headerTitle}</p>
            <p className="text-sm text-white/80">{headerSubtitle}</p>
          </div>
        </div>
        {role === "citizen" && (
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Your ID
            </span>
            <code className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
              {citizenKey}
            </code>
          </div>
        )}
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {roleStats.map((s) => (
          <div key={s.label} className="rounded-card border border-slate-100 bg-white p-4 shadow-card">
            <div className="flex items-center gap-2 text-slate-500">
              <IconStats className="h-4 w-4" />
              <p className="text-[10px] font-bold uppercase tracking-wide">{s.label}</p>
            </div>
            <p className="mt-1 text-3xl font-extrabold tabular-nums text-slate-900">
              {loading ? "—" : s.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-bold text-slate-900">Preferences</h2>
        <div className="rounded-card border border-slate-100 bg-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">Language</p>
              <p className="text-xs text-slate-500">Choose your interface language</p>
            </div>
            <div className="flex overflow-hidden rounded-full border border-slate-200">
              <button
                type="button"
                onClick={() => setLocale("en")}
                className={`px-4 py-1.5 text-sm font-semibold ${
                  locale === "en" ? "bg-primary text-white" : "text-slate-600"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLocale("te")}
                className={`px-4 py-1.5 text-sm font-semibold ${
                  locale === "te" ? "bg-primary text-white" : "text-slate-600"
                }`}
              >
                తెలుగు
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-bold text-slate-900">Quick links</h2>
        <div className="space-y-2">
          {quickLinks.map((l) => (
            <QuickLink key={l.href} href={l.href} label={l.label} hint={l.hint} />
          ))}
        </div>
      </section>

      <section className="mt-6 space-y-2">
        <Link
          href="/vision"
          className="flex items-center justify-between rounded-card border border-slate-100 bg-white px-4 py-3 shadow-card transition-colors hover:border-primary/30"
        >
          <div>
            <p className="font-semibold text-slate-900">About MPconnect</p>
            <p className="text-xs text-slate-500">Vision, docs & how it works</p>
          </div>
          <span className="text-sm font-semibold text-primary">→</span>
        </Link>
        <Link
          href="/?pick=1"
          className="flex items-center justify-center rounded-card border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
        >
          Switch role
        </Link>
      </section>
    </div>
  );
}
