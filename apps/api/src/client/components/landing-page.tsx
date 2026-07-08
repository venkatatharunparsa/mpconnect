import Link from "next/link";

const MOMENTS = [
  { n: 1, title: "Telugu voice → structured demand", desc: "A voice note becomes a categorized, located submission in seconds (Gemini multimodal).", href: "/submit" },
  { n: 2, title: "40 voices → 1 Demand", desc: "Duplicates merge into Master Demands with true affected-citizen counts.", href: "/dashboard" },
  { n: 3, title: "Demand hotspot map", desc: "Where need concentrates across the constituency.", href: "/dashboard" },
  { n: 4, title: "Evidence-weighed decisions", desc: "School upgrade vs vocational centre — citizen demand fused with UDISE + Census data.", href: "/dashboard" },
  { n: 5, title: "Ranked works + MPLADS pack", desc: "Priorities the MP can act on, with statutory funding clocks.", href: "/dashboard" },
  { n: 6, title: "Citizen-verified closure", desc: "Nothing is 'resolved' until citizens confirm. Denials publicly reopen.", href: "/dashboard" },
  { n: 7, title: "Attack-resistant by design", desc: "Coordinated fake-report floods quarantine automatically.", href: "/review" },
];

export default function Home() {
  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold text-primary">
        Citizens speak. Data decides. Citizens confirm.
      </h1>
      <p className="mt-2 text-lg text-slate-600 max-w-2xl">
        MPconnect turns fragmented citizen voices into ranked, evidence-backed development
        priorities for the Visakhapatnam Lok Sabha constituency — and nothing counts as
        &ldquo;done&rdquo; until citizens confirm it.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOMENTS.map((m) => (
          <Link
            key={m.n}
            href={m.href}
            className="rounded-lg border border-slate-200 bg-white p-4 hover:border-primary transition-colors"
          >
            <div className="text-xs font-semibold text-primary">MOMENT {m.n}</div>
            <div className="mt-1 font-semibold">{m.title}</div>
            <div className="mt-1 text-sm text-slate-600">{m.desc}</div>
          </Link>
        ))}
      </div>
      <p className="mt-8 text-sm text-slate-500">
        Built on ground truth: a source-cited authority registry, real GVMC complaint
        taxonomy, and public datasets. See <Link className="underline" href="/vision">the vision</Link> and the{" "}
        <a className="underline" href="https://github.com/YOUR_ORG/mpconnect/tree/main/docs">
          19 research &amp; design documents
        </a>.
      </p>
    </div>
  );
}
