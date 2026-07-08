import Link from "next/link";

const MOMENTS = [
  {
    n: 1,
    title: "Telugu voice → structured demand",
    desc: "Gemini multimodal extraction in seconds",
    href: "/submit",
    live: "partial",
  },
  {
    n: 2,
    title: "40 voices → 1 Demand",
    desc: "Merge with true affected-citizen counts",
    href: "/dashboard",
    live: true,
  },
  {
    n: 3,
    title: "Demand hotspot map",
    desc: "Constituency map, clusters by volume × urgency",
    href: "/dashboard",
    live: true,
  },
  {
    n: 4,
    title: "Evidence-weighed decisions",
    desc: "School upgrade vs vocational — UDISE + Census fusion",
    href: "/dashboard",
    live: "partial",
  },
  {
    n: 5,
    title: "Ranked works + MPLADS pack",
    desc: "Priority scores + statutory funding clocks",
    href: "/dashboard",
    live: "partial",
  },
  {
    n: 6,
    title: "Citizen-verified closure",
    desc: "Deny claimed fix → publicly reopens",
    href: "/dashboard",
    live: "partial",
  },
  {
    n: 7,
    title: "Attack absorbed",
    desc: "Coordinated fake reports quarantined",
    href: "/review",
    live: true,
  },
] as const;

const BUILT = [
  "MP dashboard UI — map, ranked list, stats strip, detail drawer",
  "Hash-verified timeline component (chain badge pending API)",
  "Public rally point /p/[id] + WhatsApp OG share card",
  "Human review console — validation, merge, quarantine tabs",
  "Append-only event ledger + schema (lib/events.ts)",
  "Source-cited authority registry + pilot ward seed data",
  "Problem taxonomy from GVMC field study",
];

const SOCKETED = [
  "WhatsApp Business Cloud API",
  "Exotel toll-free voice line",
  "Bhashini ASR (production Telugu path)",
  "Real OTP / citizen authentication",
  "DLT SMS gateway",
  "Review queue APIs + simulate-attack endpoint",
  "Demand/submission read & write APIs",
  "Synthetic citizen corpus seed",
];

const VISION_ROADMAP = [
  "Full escalation engine + help desk",
  "DISPUTE evidence ledger + community layer",
  "State-scale sharding + DIGIT interop",
  "Trust-score ML + full coordination detection",
  "Notifications infrastructure",
  "News & social intelligence (human-gated)",
];

const DOCS = [
  { file: "VISION.md", desc: "What we're building, why, and for whom — the Arilova story and full end-state feature map." },
  { file: "EXECUTION.md", desc: "How we build: phase plan, prototype gates, team roles, and dependency logic." },
  { file: "hackathon-build-pack-v1.0.md", desc: "34-hour war plan: 7 demo moments, hour plan, build prompts H0–H13, seed spec." },
  { file: "functional-requirements-v1.0.md", desc: "Scope law — every feature traceable to a requirement ID." },
  { file: "non-functional-requirements-v1.0.md", desc: "Engineering targets, pilot-gate criteria, performance and reliability." },
  { file: "system-design-v1.0.md", desc: "Full production system design — the complete end-state architecture." },
  { file: "technical-design-v1.0.md", desc: "Event-sourced Problem entity, stack choices, implementation detail." },
  { file: "architecture-workflows-tech-v1.0.md", desc: "Engineering handbook: workflows, features, and technology in one reference." },
  { file: "phases-and-prototype-v1.0.md", desc: "Phase decomposition P0–P4 and the six-beat prototype specification." },
  { file: "abuse-defense-v1.0.md", desc: "Seven-layer abuse defense: corroboration gate, coordination detection, boomerang." },
  { file: "authority-kb-visakhapatnam-v0.1.md", desc: "Source-cited authority registry for Visakhapatnam routing." },
  { file: "validation-report-v1.0.md", desc: "Design validation vs OSS landscape, field evidence, and security." },
  { file: "existing-systems-study-v0.1.md", desc: "CPGRAMS, AP PGRS, GVMC portals — gap analysis." },
  { file: "vizag-pain-points-fitgap-v0.1.md", desc: "Documented citizen pain points and fit-gap against VGPS design." },
  { file: "vizag-political-reality-v1.0.md", desc: "Honest political-operating-system analysis for Vizag." },
  { file: "grievance-trends-v0.1.md", desc: "Citizen grievance trends in Visakhapatnam / AP." },
  { file: "scheme-funding-corpus-v0.1.md", desc: "Scheme and funding data for the solution recommendation engine." },
  { file: "prompts-playbook-v1.0.md", desc: "Ordered AI coding prompts — one session, one commit." },
  { file: "VGPS-basic-version.md", desc: "Early concept document for the Virtual Governance platform." },
];

const PHASES = [
  { label: "Hackathon prototype", sub: "P0.5 · Jul 2026", desc: "7 demo moments · Gemini + Maps" },
  { label: "Prototype", sub: "P1 · ~6 weeks", desc: "Prove the soul on real pilot-ward data" },
  { label: "Pilot with MP office", sub: "P2 · 3–4 months", desc: "3–5 wards · real citizens · DPIA" },
  { label: "Full constituency", sub: "P3 · ~6 months", desc: "98 wards · MPLADS full · monsoon mode" },
  { label: "State expansion", sub: "P4", desc: "Second constituency · DIGIT interop" },
];

function FlowDiagram() {
  return (
    <svg viewBox="0 0 720 120" className="w-full max-w-3xl" aria-label="How MPconnect works">
      {[
        { x: 10, label: "Intake" },
        { x: 130, label: "Understand" },
        { x: 250, label: "Merge" },
        { x: 370, label: "Route" },
        { x: 490, label: "Verify" },
        { x: 610, label: "Dashboard" },
      ].map((step, i, arr) => (
        <g key={step.label}>
          <rect
            x={step.x}
            y="40"
            width="100"
            height="44"
            rx="8"
            fill="#0f4c81"
            opacity={0.12 + i * 0.02}
          />
          <rect x={step.x} y="40" width="100" height="44" rx="8" fill="none" stroke="#0f4c81" strokeWidth="2" />
          <text x={step.x + 50} y="67" textAnchor="middle" fontSize="13" fontWeight="600" fill="#0f4c81">
            {step.label}
          </text>
          {i < arr.length - 1 && (
            <path
              d={`M ${step.x + 102} 62 L ${arr[i + 1].x - 2} 62`}
              stroke="#94a3b8"
              strokeWidth="2"
              markerEnd="url(#arrow)"
            />
          )}
        </g>
      ))}
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" />
        </marker>
      </defs>
      <text x="360" y="110" textAnchor="middle" fontSize="11" fill="#64748b">
        AI proposes · humans dispose · citations or silence
      </text>
    </svg>
  );
}

export default function VisionPage() {
  return (
    <article className="space-y-16 py-8">
      <header>
        <h1 className="text-3xl font-bold text-primary">The vision behind MPconnect</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Google provides the intelligence. We provide the ground truth it stands on.
        </p>
      </header>

      {/* §1 Arilova story */}
      <section>
        <h2 className="text-xl font-bold text-slate-900">The problem, in one story</h2>
        <blockquote className="mt-4 border-l-4 border-primary pl-4 text-slate-700 leading-relaxed">
          A woman in Arilova Colony has no drinking water. She can call a toll-free line, queue at
          the Collectorate on Monday, message the GVMC WhatsApp number, use the PGRS portal, the
          PuraSeva app, the GVMC portal, tell her ward volunteer, or write a letter. Eight
          channels — and none of them talk to each other. Her complaint joins thousands of others
          as isolated tickets. Weeks later she gets an SMS: &ldquo;resolved.&rdquo; Nothing was
          fixed. Nobody asked her.
        </blockquote>
        <p className="mt-4 text-slate-700 leading-relaxed">
          This is not a hypothetical. Andhra Pradesh&apos;s own grievance system claims{" "}
          <strong>90% resolution while an independent survey found 78% dissatisfaction</strong> —
          29,400 complaints reopened for faulty resolution, officials documented forcing citizens
          to withdraw complaints. In a GVMC field study, citizens asked for exactly one thing:{" "}
          <em>proof — a photo with GPS — before a complaint gets closed.</em>
        </p>
        <p className="mt-2 text-sm">
          Source:{" "}
          <a
            href="https://m.thewire.in/article/government/too-many-delays-false-closures-why-andhras-public-grievance-redressal-system-is-facing-backlash"
            className="text-primary underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            The Wire — AP public grievance redressal backlash
          </a>
          {" · "}
          <a href="/docs/validation-report-v1.0.md" className="text-primary underline">
            eGov/CEPT field study (validation-report-v1.0.md)
          </a>
        </p>
      </section>

      {/* §2 How it works */}
      <section>
        <h2 className="text-xl font-bold text-slate-900">How it works</h2>
        <div className="mt-6">
          <FlowDiagram />
        </div>
      </section>

      {/* §3 Seven moments */}
      <section>
        <h2 className="text-xl font-bold text-slate-900">The seven demo moments</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MOMENTS.map((m) => (
            <div
              key={m.n}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="text-xs font-semibold text-primary">MOMENT {m.n}</div>
              <div className="mt-1 font-semibold">{m.title}</div>
              <p className="mt-1 text-sm text-slate-600">{m.desc}</p>
              <div className="mt-3">
                {m.live === true ? (
                  <Link href={m.href} className="text-sm font-medium text-primary underline">
                    Try it live →
                  </Link>
                ) : m.live === "partial" ? (
                  <Link href={m.href} className="text-sm text-amber-700 underline">
                    Partial — UI built, APIs pending →
                  </Link>
                ) : (
                  <span className="text-sm text-slate-400">Coming — route not built yet</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* §4 Built / Socketed / Vision */}
      <section>
        <h2 className="text-xl font-bold text-slate-900">Built · Socketed · Vision</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-green-200 bg-green-50/50 p-4">
            <h3 className="font-bold text-green-900">Built</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {BUILT.map((item) => (
                <li key={item}>✓ {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
            <h3 className="font-bold text-amber-900">Socketed</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {SOCKETED.map((item) => (
                <li key={item}>◌ {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-bold text-slate-800">Vision</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {VISION_ROADMAP.map((item) => (
                <li key={item}>→ {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* §5 Ground truth */}
      <section>
        <h2 className="text-xl font-bold text-slate-900">The ground truth — docs/</h2>
        <p className="mt-2 text-sm text-slate-600">
          {DOCS.length} research &amp; design documents. Every authority fact and scheme claim is
          cited — or the code refuses to guess.
        </p>
        <ul className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {DOCS.map((d) => (
            <li key={d.file} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:gap-4">
              <span className="shrink-0 font-mono text-sm text-slate-800 sm:w-72">{d.file}</span>
              <span className="text-sm text-slate-600">{d.desc}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* §6 Roadmap strip */}
      <section>
        <h2 className="text-xl font-bold text-slate-900">Roadmap</h2>
        <div className="mt-6 flex flex-col gap-0 sm:flex-row">
          {PHASES.map((p, i) => (
            <div
              key={p.label}
              className={`flex-1 border border-slate-200 bg-white p-4 ${
                i > 0 ? "sm:border-l-0" : ""
              }`}
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                {p.sub}
              </div>
              <div className="mt-1 font-bold text-slate-900">{p.label}</div>
              <p className="mt-1 text-sm text-slate-600">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
