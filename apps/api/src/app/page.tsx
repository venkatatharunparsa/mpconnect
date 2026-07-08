import Link from "next/link";

export default function ApiHomePage() {
  const webUrl = (
    process.env.NEXT_PUBLIC_WEB_URL ?? 
    process.env.CORS_ORIGINS?.split(",")[0]?.trim() ?? 
    "http://localhost:3001"
  ).replace(/\/$/, "");

  return (
    <div className="py-16 text-center">
      <h1 className="text-3xl font-bold text-primary">MPconnect API</h1>
      <p className="mt-4 text-slate-600 max-w-lg mx-auto">
        Backend service — REST endpoints under <code className="bg-slate-100 px-1 rounded">/api/*</code>.
        The citizen UI runs as a separate frontend app.
      </p>
      <p className="mt-6">
        <Link href={`${webUrl}/submit`} className="text-primary underline font-medium">
          Open frontend →
        </Link>
      </p>
      <p className="mt-8 text-sm text-slate-500">
        API reference: <code>docs/api.md</code>
      </p>
    </div>
  );
}
