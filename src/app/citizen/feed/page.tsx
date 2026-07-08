"use client";

import { useEffect, useState } from "react";
import { fetchDemands } from "@/components/citizen/api";
import { apiFetch } from "@/lib/api-client";
import type { Demand } from "@/components/citizen/types";

// Haversine helper
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function CitizenFeedPage() {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const demandsData = await fetchDemands();
      const publicDemands = demandsData.filter((d) => d.visibility === "public");
      setDemands(publicDemands as any);
    } catch (err) {
      console.error("Failed to load feed demands:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Support upvoting checking
  const handleUpvote = async (d: Demand) => {
    if (!navigator.geolocation) {
      alert("Geo-Verification Error: Geolocation is not supported by your browser.");
      return;
    }

    alert("Retrieving your GPS coordinates for geo-verification...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        if (d.lat && d.lng) {
          const distance = getDistanceKm(userLat, userLng, d.lat, d.lng);
          if (distance > 15) {
            alert(
              `Geo-Verification Failed: You are ${distance.toFixed(
                1
              )} km away. You must be within 15 km of the issue's location to verify you are affected by it.`
            );
            return;
          }
        }

        try {
          const res = await apiFetch(`/api/demands/${d.id}/support`, {
            method: "POST",
          });
          if (res.ok) {
            setDemands((prev) =>
              prev.map((item) =>
                item.id === d.id ? { ...item, affectedCount: item.affectedCount + 1 } : item
              )
            );
            alert("Geo-Verification Successful: Support registered for this priority!");
          } else {
            alert("You have already supported this demand.");
          }
        } catch {
          alert("Network error registering support.");
        }
      },
      () => {
        alert("Geo-Verification Failed: Geolocation permission denied or unavailable.");
      }
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto w-full space-y-4">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-200">
        Public community priorities Feed
      </h3>
      {loading ? (
        <p className="text-xs text-slate-400">Loading feed...</p>
      ) : demands.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-8">No public reports yet.</p>
      ) : (
        demands.map((d) => (
          <div key={d.id} className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{d.title}</h4>
              <p className="text-[11px] text-slate-500 font-semibold capitalize mt-1">
                {d.category} · {d.ward}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-xs font-black text-slate-700">👍 {d.affectedCount} affected</span>
              <button
                onClick={() => handleUpvote(d)}
                className="border border-primary text-primary hover:bg-primary/5 text-xs font-black rounded-full px-5 py-2 transition-all"
              >
                Affects me too
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
