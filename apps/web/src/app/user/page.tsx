import { Suspense } from "react";
import { RoleGate } from "@/components/role/RoleGate";
import { DashboardProvider } from "@/components/dashboard/DashboardContext";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { MapSkeleton } from "@/components/dashboard/LoadingSkeleton";

export default function UserLanding() {
  return (
    <RoleGate role="citizen">
      <Suspense fallback={<MapSkeleton />}>
        <DashboardProvider>
          <DashboardView variant="home" />
        </DashboardProvider>
      </Suspense>
    </RoleGate>
  );
}

