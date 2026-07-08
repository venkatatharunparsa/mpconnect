"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center py-10 px-4">
      <div className="w-full max-w-4xl text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Welcome to MPconnect
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
          People's Priorities Engine for the Visakhapatnam Lok Sabha constituency. 
          Select your profile to enter the portal.
        </p>
      </div>

      <div className="mt-10 grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
        {/* Card 1: Citizen */}
        <Link
          href="/citizen"
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
        >
          <div className="space-y-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
              📢
            </span>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">
                Citizen Portal
              </h2>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                ప్రజా పోర్టల్
              </p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Report local grievances via voice/text, track verification updates, and upvote community needs.
            </p>
          </div>
          <div className="mt-6 flex items-center text-xs font-bold text-primary group-hover:underline">
            Enter Portal →
          </div>
        </Link>

        {/* Card 2: MP */}
        <Link
          href="/mp"
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
        >
          <div className="space-y-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-2xl">
              🏛️
            </span>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-accent-dark transition-colors">
                Member of Parliament
              </h2>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                ఎంపీ డాష్‌బోర్డ్
              </p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Analyze prioritised constituency demands, view UDISE data fusion evidence, and query the command assistant.
            </p>
          </div>
          <div className="mt-6 flex items-center text-xs font-bold text-accent group-hover:underline">
            Enter Command Center →
          </div>
        </Link>

        {/* Card 3: Official */}
        <Link
          href="/official"
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
        >
          <div className="space-y-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">
              👔
            </span>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-slate-800 transition-colors">
                Govt Official
              </h2>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                అధికారిక లాగిన్
              </p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Jurisdictional action pipelines for GVMC, EPDCL, and other administrative departments.
            </p>
          </div>
          <div className="mt-6 flex items-center text-xs font-bold text-slate-600 group-hover:underline">
            Enter Workspace →
          </div>
        </Link>
      </div>
    </div>
  );
}
