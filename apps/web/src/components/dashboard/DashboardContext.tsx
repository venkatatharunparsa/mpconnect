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
  const { locale, setLocale } = useApp();
  const roleParam = searchParams.get("role");
  const initialRole: DemoRole =
    roleParam === "official" || roleParam === "mp" ? roleParam : "citizen";

  const [role, setRoleState] = useState<DemoRole>(initialRole);
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);

  const setRole = useCallback(
    (next: DemoRole) => {
      setRoleState(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next === "citizen") params.delete("role");
      else params.set("role", next);
      const qs = params.toString();
      router.replace(qs ? `/dashboard?${qs}` : "/dashboard", { scroll: false });
    },
    [router, searchParams],
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
