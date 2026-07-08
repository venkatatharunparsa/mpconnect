"use client";

import { useEffect } from "react";
import { useApp, type AppRole } from "@/components/shell/AppProvider";

export function RoleGate({
  role,
  children,
}: {
  role: AppRole;
  children: React.ReactNode;
}) {
  const { setRole } = useApp();

  useEffect(() => {
    setRole(role);
  }, [role, setRole]);

  return <>{children}</>;
}

