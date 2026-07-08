"use client";

import { useEffect, useState } from "react";
import { fetchDemands, fetchWards } from "@/components/citizen/api";
import { CitizenMap } from "@/components/citizen/CitizenMap";
import type { Demand, Ward } from "@/components/citizen/types";

export default function CitizenMapPage() {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [wardsAvailable, setWardsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const locale = "en";

  const load = async () => {
    try {
      const demandsData = await fetchDemands();
      const publicDemands = demandsData.filter((d) => d.visibility === "public");
      const wardsResult = await fetchWards();
      setDemands(publicDemands as any);
      setWards(wardsResult.wards as any);
      setWardsAvailable(wardsResult.available);
    } catch (err) {
      console.error("Failed to load Citizen map data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="absolute inset-0">
      <CitizenMap
        demands={demands}
        wards={wards}
        wardsAvailable={wardsAvailable}
        loading={loading}
        locale={locale}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
    </div>
  );
}
