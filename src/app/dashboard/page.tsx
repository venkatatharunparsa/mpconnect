import { Suspense } from "react";
import { DashboardProvider } from "@/components/dashboard/DashboardContext";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { MapSkeleton } from "@/components/dashboard/LoadingSkeleton";

export default function DashboardPage() {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <DashboardProvider>
        <DashboardView />
      </DashboardProvider>
    </Suspense>
  );
}
