"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchAuthorities } from "./api";
import type { Authority } from "./types";
import type { Demand } from "@/components/dashboard/types";

const AUTHORITY_KEY = "mpconnect:authorityId";

interface AuthorityContextValue {
  authorityId: number | null;
  authority: Authority | null;
  authorities: Authority[];
  loading: boolean;
  setAuthorityId: (id: number) => void;
  clearAuthority: () => void;
  demandMatchesAuthority: (demand: Demand) => boolean;
}

const AuthorityContext = createContext<AuthorityContextValue | null>(null);

export function AuthorityProvider({ children }: { children: ReactNode }) {
  const [authorityId, setAuthorityIdState] = useState<number | null>(null);
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(AUTHORITY_KEY);
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed)) setAuthorityIdState(parsed);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const list = await fetchAuthorities();
      if (!cancelled) {
        setAuthorities(list);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setAuthorityId = useCallback((id: number) => {
    setAuthorityIdState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTHORITY_KEY, String(id));
    }
  }, []);

  const clearAuthority = useCallback(() => {
    setAuthorityIdState(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTHORITY_KEY);
    }
  }, []);

  const authority = useMemo(
    () => authorities.find((a) => a.id === authorityId) ?? null,
    [authorities, authorityId],
  );

  const demandMatchesAuthority = useCallback(
    (demand: Demand) => {
      if (!authority) return false;
      if (demand.authorityId === authority.id) return true;
      return authority.categories.includes(demand.category);
    },
    [authority],
  );

  const value = useMemo(
    () => ({
      authorityId,
      authority,
      authorities,
      loading,
      setAuthorityId,
      clearAuthority,
      demandMatchesAuthority,
    }),
    [authorityId, authority, authorities, loading, setAuthorityId, clearAuthority, demandMatchesAuthority],
  );

  return <AuthorityContext.Provider value={value}>{children}</AuthorityContext.Provider>;
}

export function useAuthority() {
  const ctx = useContext(AuthorityContext);
  if (!ctx) throw new Error("useAuthority must be used within AuthorityProvider");
  return ctx;
}
