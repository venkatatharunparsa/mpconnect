import { Suspense } from "react";
import { RoleGate } from "@/components/role/RoleGate";
import { DashboardProvider } from "@/components/dashboard/DashboardContext";
import { AuthorityWorkspace } from "@/components/authority/AuthorityWorkspace";
import { MapSkeleton } from "@/components/dashboard/LoadingSkeleton";

export default function AuthorityWorkspacePage() {
  return (
    <RoleGate role="official">
      <Suspense fallback={<MapSkeleton />}>
        <DashboardProvider>
          <AuthorityWorkspace />
        </DashboardProvider>
      </Suspense>
    </RoleGate>
  );
}
