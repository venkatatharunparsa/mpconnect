"use client";

import { useEffect, useState } from "react";
import { fetchDemands, fetchWards } from "@/components/mp/api";
import { MpMap } from "@/components/mp/MpMap";
import { MpDemandDrawer } from "@/components/mp/MpDemandDrawer";
import type { Demand, Ward } from "@/components/mp/types";

export default function MpMapPage() {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [wardsAvailable, setWardsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const locale = "en";

  const load = async () => {
    try {
      const demandsData = await fetchDemands();
      const wardsResult = await fetchWards();
      setDemands(demandsData as any);
      setWards(wardsResult.wards as any);
      setWardsAvailable(wardsResult.available);
    } catch (err) {
      console.error("Failed to load map data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selectedDemand = demands.find((d) => d.id === selectedId) ?? null;

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="flex-1 relative">
        <MpMap
          demands={demands}
          wards={wards}
          wardsAvailable={wardsAvailable}
          loading={loading}
          locale={locale}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      <MpDemandDrawer
        demand={selectedDemand}
        open={selectedId != null}
        onClose={() => setSelectedId(null)}
        locale={locale}
      />
    </div>
  );
}
