"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchDemands } from "@/components/official/api";
import { OfficialList } from "@/components/official/OfficialList";
import { apiFetch } from "@/lib/api-client";
import type { Demand } from "@/components/official/types";

export default function OfficialWorkspacePage() {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [officialAgency, setOfficialAgency] = useState<"gvmc" | "epdcl">("gvmc");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fixPhoto, setFixPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);
  const locale = "en";

  const load = async () => {
    try {
      const demandsData = await fetchDemands();
      setDemands(demandsData as any);
    } catch (err) {
      console.error("Failed to load workspace demands:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredDemands = useMemo(() => {
    return demands.filter(
      (d) => d.authorityId != null && d.state !== "resolved_verified"
    );
  }, [demands]);

  const selectedDemand = useMemo(() => {
    return demands.find((d) => d.id === selectedId) ?? null;
  }, [demands, selectedId]);

  const handleOfficialAction = async (id: string, action: "start" | "fix") => {
    if (action === "fix" && !fixPhoto) {
      alert("Evidence photo is required to submit a resolution fix claim.");
      return;
    }

    setSubmittingAction(true);
    try {
      let endpoint = `/api/demands/${id}/route-approve`;
      let payload: any = { actorId: `official-${officialAgency}` };

      if (action === "fix") {
        endpoint = `/api/demands/${id}/fix-claim`;
        payload.evidenceUrl = "https://gvmc.gov.in/resolutions/evidence-mock.jpg";
      }

      const res = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(
          action === "start"
            ? "Assignment accepted! Work status set to In Progress."
            : "Fix claim submitted! Awaiting citizen verification loop closure."
        );
        setFixPhoto(null);
        setPhotoPreview(null);
        load();
      } else {
        const errData = await res.json();
        alert(errData.error ?? "Failed to register action.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting workspace update.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFixPhoto(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 min-h-0 overflow-hidden">
      
      {/* Left: Queue List */}
      <div className="border-r border-slate-200 flex flex-col min-h-0 overflow-hidden bg-white">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center shrink-0">
          <span className="text-xs font-black text-slate-800 uppercase">Agency Queue:</span>
          <select
            value={officialAgency}
            onChange={(e) => setOfficialAgency(e.target.value as any)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold bg-slate-50"
          >
            <option value="gvmc">GVMC (Municipal)</option>
            <option value="epdcl">EPDCL (Electricity)</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/20">
          <OfficialList
            demands={filteredDemands}
            loading={loading}
            locale={locale}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
      </div>

      {/* Right: Actions Sheet */}
      <div className="p-6 bg-slate-50">
        {selectedDemand ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              RESOLVE GRIEVANCE: "{selectedDemand.title}"
            </h4>

            {selectedDemand.state === "routed" && (
              <button
                onClick={() => handleOfficialAction(selectedDemand.id, "start")}
                disabled={submittingAction}
                className="w-full bg-primary text-white rounded-xl py-3 text-xs font-black transition-all shadow-md"
              >
                Accept & Start Work
              </button>
            )}

            {(selectedDemand.state === "routed" || selectedDemand.state === "in_progress") && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border">
                <label className="block text-[9px] font-black uppercase text-slate-500 tracking-wider">
                  📸 Resolution Evidence Photo (Required)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="text-xs border rounded-xl bg-white p-2 w-full font-bold"
                />
                {photoPreview && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-40 bg-white">
                    <img
                      src={photoPreview}
                      alt="Evidence Preview"
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <button
                  onClick={() => handleOfficialAction(selectedDemand.id, "fix")}
                  disabled={submittingAction || !fixPhoto}
                  className="w-full bg-emerald-600 text-white rounded-xl py-3 text-xs font-black transition-all disabled:opacity-40"
                >
                  Submit Fix Evidence
                </button>
              </div>
            )}

            {selectedDemand.state === "resolved_unverified" && (
              <p className="text-xs font-bold text-amber-800 bg-amber-50 rounded-2xl p-4 border border-amber-250">
                Awaiting citizen closure verification.
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            Select a demand from the queue to start work actions.
          </div>
        )}
      </div>

    </div>
  );
}
