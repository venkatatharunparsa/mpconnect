"use client";

import dynamic from "next/dynamic";
import { MapSkeleton } from "./LoadingSkeleton";
import type { Demand, UiLocale, Ward } from "./types";

// Load Leaflet Map dynamically with ssr disabled to prevent window undefined compilation errors on Next.js server side.
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

interface DemandMapProps {
  demands: Demand[];
  wards: Ward[];
  wardsAvailable: boolean;
  loading: boolean;
  locale: UiLocale;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function DemandMap({
  demands,
  wards,
  wardsAvailable,
  loading,
  onSelect,
}: DemandMapProps) {
  if (loading) return <MapSkeleton />;

  return (
    <div className="h-full w-full relative">
      <LeafletMap
        demands={demands}
        wards={wards}
        wardsAvailable={wardsAvailable}
        onSelect={onSelect}
      />
    </div>
  );
}
