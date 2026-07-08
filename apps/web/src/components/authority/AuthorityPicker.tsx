"use client";

import { useRouter } from "next/navigation";
import { useAuthority } from "./AuthorityContext";

export function AuthorityPicker() {
  const router = useRouter();
  const { authorities, loading, setAuthorityId } = useAuthority();

  const verified = authorities.filter((a) => a.verified);

  if (loading) {
    return <div className="mx-auto max-w-2xl p-6"><div className="h-48 animate-pulse rounded-xl bg-slate-100" /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-primary/70">Authority login</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-900">Choose your department</h1>
        <p className="mt-2 text-sm text-slate-600">
          Pick the office you represent. Your dashboard and workspace will show only issues routed to
          your jurisdiction.
        </p>

        <div className="mt-5 space-y-2">
          {verified.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              No verified authorities loaded. Run <code className="text-xs">pnpm seed</code> on the API.
            </p>
          )}
          {verified.map((auth) => (
            <button
              key={auth.id}
              type="button"
              onClick={() => {
                setAuthorityId(auth.id);
                router.push("/authority");
              }}
              className="w-full rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <p className="text-sm font-bold text-slate-900">{auth.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                {auth.org} · {auth.level} · {auth.categories.length} categories
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
