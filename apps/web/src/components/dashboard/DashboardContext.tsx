"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/components/shell/AppProvider";
import type { DemoRole } from "./types";

interface DashboardContextValue {
  role: DemoRole;
  setRole: (role: DemoRole) => void;
  locale: ReturnType<typeof useApp>["locale"];
  setLocale: ReturnType<typeof useApp>["setLocale"];
  selectedDemandId: string | null;
  selectDemand: (id: string | null) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, setLocale, role: appRole, setRole: setAppRole } = useApp();
  const roleParam = searchParams.get("role");
  const initialRole: DemoRole =
    roleParam === "official" || roleParam === "mp"
      ? roleParam
      : appRole === "official" || appRole === "mp"
        ? appRole
        : "citizen";

  const [role, setRoleState] = useState<DemoRole>(initialRole);
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);

  const setRole = useCallback(
    (next: DemoRole) => {
      setRoleState(next);
      setAppRole(next);
      const root =
        next === "citizen"
          ? "/user"
          : next === "official"
            ? typeof window !== "undefined" && localStorage.getItem("mpconnect:authorityId")
              ? "/authority"
              : "/authority/pick"
            : "/mp";
      router.replace(root, { scroll: false });
    },
    [router, setAppRole],
  );

  const value = useMemo(
    () => ({
      role,
      setRole,
      locale,
      setLocale,
      selectedDemandId,
      selectDemand: setSelectedDemandId,
    }),
    [role, setRole, locale, setLocale, selectedDemandId],
  );

  return (
    <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
