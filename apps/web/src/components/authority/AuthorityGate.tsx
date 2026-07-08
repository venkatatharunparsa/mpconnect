"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthority } from "./AuthorityContext";

export function AuthorityGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { authorityId, loading } = useAuthority();

  useEffect(() => {
    if (loading) return;
    if (pathname.startsWith("/authority/pick")) return;
    if (!authorityId) {
      router.replace("/authority/pick");
    }
  }, [authorityId, loading, pathname, router]);

  if (loading) {
    return <div className="h-40 animate-pulse rounded-xl bg-slate-100" />;
  }

  if (!authorityId && !pathname.startsWith("/authority/pick")) {
    return null;
  }

  return <>{children}</>;
}
