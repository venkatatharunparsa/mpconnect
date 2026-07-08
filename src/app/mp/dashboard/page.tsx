"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchDemands } from "@/components/mp/api";
import { StatTiles } from "@/components/mp/StatTiles";
import { LiveFeed } from "@/components/mp/LiveFeed";
import { ChatbotPanel } from "@/components/mp/ChatbotPanel";
import { apiFetch } from "@/lib/api-client";
import type { Demand } from "@/components/mp/types";

export default function MpDashboardPage() {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [mpEvents, setMpEvents] = useState<any[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [statFilter, setStatFilter] = useState<"all" | "solved" | "unsolved" | "assigned" | "unassigned">("all");

  const load = async () => {
    try {
      const demandsData = await fetchDemands();
      setDemands(demandsData as any);
    } catch (err) {
      console.error("Failed to load dashboard demands:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Poll live events
  useEffect(() => {
    let active = true;

    const fetchLiveFeed = async () => {
      try {
        const res = await apiFetch("/api/demands/events");
        if (res.ok && active) {
          const list = await res.json();
          setMpEvents(list);
        }
      } catch (err) {
        console.error("Feed error:", err);
      }
    };

    fetchLiveFeed();
    const interval = setInterval(fetchLiveFeed, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Compute stats
  const stats = useMemo(() => {
    const total = demands.length;
    const solved = demands.filter((d) => d.state === "resolved_verified").length;
    const unsolved = total - solved;
    const assigned = demands.filter((d) => d.state !== "resolved_verified" && d.authorityId != null).length;
    const unassigned = demands.filter((d) => d.state !== "resolved_verified" && d.authorityId == null).length;
    
    const reopenedCount = demands.filter((d) => d.state === "reopened").length;
    const denominator = solved + reopenedCount;
    const verifiedResolutionRate = denominator > 0 ? (solved / denominator) * 100 : 0;

    return { total, solved, unsolved, assigned, unassigned, verifiedResolutionRate, reopenedCount };
  }, [demands]);

  // Fake activeTab switch to preserve layout callback
  const handleSetActiveTab = (tab: string) => {
    if (tab === "issues") {
      window.location.href = `/mp/issues?filter=${statFilter}`;
    }
  };

  return (
    <div className="flex-1 flex flex-col md:grid md:grid-cols-2 min-h-0 overflow-hidden bg-white">
      {/* Left Column: Stats & Performance */}
      <StatTiles
        loading={loading}
        stats={stats}
        statFilter={statFilter}
        setStatFilter={setStatFilter}
        setActiveTab={handleSetActiveTab}
      />

      {/* Right Column: Live activity events stream */}
      <LiveFeed events={mpEvents} />

      {/* Floating Action Chat Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-accent text-white h-14 w-14 rounded-full shadow-lg flex items-center justify-center text-2xl hover:scale-105 transition-all glower animate-bounce"
        aria-label="Toggle AI chatbot query console"
      >
        💬
      </button>

      {/* Chatbot Overlay Modal */}
      <ChatbotPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
