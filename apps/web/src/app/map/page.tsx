import type { Metadata } from "next";
import { MapView } from "@/components/map/MapView";

export const metadata: Metadata = {
  title: "Map — MPconnect",
  description: "Demand hotspots across the Visakhapatnam Lok Sabha constituency.",
};

export default function MapPage() {
  return <MapView />;
}
