import { Suspense } from "react";
import { RoleGate } from "@/components/role/RoleGate";
import { DashboardProvider } from "@/components/dashboard/DashboardContext";
import { AuthorityDashboard } from "@/components/authority/AuthorityDashboard";
import { MapSkeleton } from "@/components/dashboard/LoadingSkeleton";

export default function AuthorityLanding() {
  return (
    <RoleGate role="official">
      <Suspense fallback={<MapSkeleton />}>
        <DashboardProvider>
          <AuthorityDashboard />
        </DashboardProvider>
      </Suspense>
    </RoleGate>
  );
}
