"use client";

import { useEffect, useState } from "react";
import { fetchDemands } from "@/components/citizen/api";
import { HomeSummary } from "@/components/citizen/HomeSummary";
import { CopilotPanel } from "@/components/citizen/CopilotPanel";
import { apiFetch } from "@/lib/api-client";

export default function CitizenDashboardPage() {
  const [demandsCount, setDemandsCount] = useState(0);
  const [citizenKey, setCitizenKey] = useState("DEMO-ANON");
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const loadDemandsCount = async () => {
    try {
      const demandsData = await fetchDemands();
      const publicDemands = demandsData.filter((d) => d.visibility === "public");
      setDemandsCount(publicDemands.length);
    } catch (err) {
      console.error("Failed to load dashboard demands count:", err);
    }
  };

  useEffect(() => {
    loadDemandsCount();
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("mpconnect_citizen_key") ?? "DEMO-ANON";
      setCitizenKey(savedKey);
    }
  }, []);

  // Poll citizen data
  useEffect(() => {
    let active = true;
    if (citizenKey === "DEMO-ANON") return;

    const fetchCitizenData = async () => {
      try {
        const [subRes, verRes] = await Promise.all([
          apiFetch(`/api/submissions?citizenKey=${citizenKey}`),
          apiFetch(`/api/verifications?citizenKey=${citizenKey}`),
        ]);
        if (subRes.ok && active) {
          const list = await subRes.json();
          setMySubmissions(list);
        }
        if (verRes.ok && active) {
          const list = await verRes.json();
          setPendingVerifications(list);
        }
      } catch (err) {
        console.error("Citizen data load error:", err);
      }
    };

    fetchCitizenData();
    const interval = setInterval(fetchCitizenData, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [citizenKey]);

  // Handle citizen confirm/deny verification
  const handleVerification = async (id: number, response: "confirm" | "deny") => {
    try {
      const res = await apiFetch(`/api/verifications/${id}/respond`, {
        method: "POST",
        body: JSON.stringify({ response, citizenKey }),
      });
      if (res.ok) {
        setPendingVerifications((prev) => prev.filter((v) => v.id !== id));
        alert(
          response === "confirm"
            ? "Thank you! Fix has been verified resolved."
            : "Response submitted. The demand has been reopened."
        );
        loadDemandsCount();
      }
    } catch (err) {
      console.error("Verification submit error:", err);
    }
  };

  const handleSetActiveTab = (tab: string) => {
    if (tab === "register") {
      window.location.href = "/citizen/report";
    } else if (tab === "issues") {
      window.location.href = "/citizen/feed";
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      <HomeSummary
        mySubmissions={mySubmissions}
        pendingVerifications={pendingVerifications}
        demandsCount={demandsCount}
        setActiveTab={handleSetActiveTab}
        handleVerification={handleVerification}
      />

      {/* Floating Eligibility Helper FAB */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-accent text-white h-14 w-14 rounded-full shadow-lg flex items-center justify-center text-2xl hover:scale-105 transition-all glower animate-bounce"
        aria-label="Toggle scheme copilot"
      >
        🤖
      </button>

      {/* Chatbot Overlay Modal */}
      <CopilotPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
