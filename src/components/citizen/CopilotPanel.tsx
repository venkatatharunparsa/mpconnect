"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api-client";

interface CopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CopilotPanel({ isOpen, onClose }: CopilotPanelProps) {
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotMessages, setCopilotMessages] = useState<{ q: string; a: string }[]>([]);
  const [copilotLoading, setCopilotLoading] = useState(false);

  const handleCopilotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotInput.trim() || copilotLoading) return;
    const userQ = copilotInput.trim();
    setCopilotInput("");
    setCopilotLoading(true);

    try {
      const res = await apiFetch("/api/helpdesk", {
        method: "POST",
        body: JSON.stringify({ question: userQ }),
      });
      if (res.ok) {
        const body = await res.json();
        const finalAnswer =
          body.answer +
          "\n\n*Would you like to file this question as an official grievance instead?*";
        setCopilotMessages((prev) => [...prev, { q: userQ, a: finalAnswer }]);
      } else {
        setCopilotMessages((prev) => [
          ...prev,
          { q: userQ, a: "Sorry, I am unable to parse eligibility facts right now." },
        ]);
      }
    } catch {
      setCopilotMessages((prev) => [
        ...prev,
        { q: userQ, a: "Sorry, I am unable to parse eligibility facts right now." },
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg h-[580px] border border-slate-200 flex flex-col overflow-hidden shadow-2xl animate-fade-in">
        
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">✨ Scheme Assistant</h4>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Eligibility Guideline Check</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 text-sm font-black p-1.5"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50">
          {copilotMessages.length === 0 ? (
            <div className="text-center py-8 text-[10px] text-slate-400 space-y-3">
              <p>Ask eligibility or guidelines for scheme applications:</p>
              <div className="flex flex-col gap-1.5 max-w-xs mx-auto">
                {[
                  "Am I eligible for NTR Bharosa pension scheme?",
                  "What are the guidelines for MPLADS funding?",
                ].map((x) => (
                  <button
                    key={x}
                    onClick={() => setCopilotInput(x)}
                    className="w-full text-left bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-600 font-semibold"
                  >
                    {x}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            copilotMessages.map((msg, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-end">
                  <span className="bg-slate-200 text-slate-700 rounded-xl px-4 py-2 text-xs">
                    {msg.q}
                  </span>
                </div>
                <div className="flex justify-start">
                  <span className="bg-blue-50 border border-blue-100 text-blue-900 rounded-xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap">
                    {msg.a}
                  </span>
                </div>
              </div>
            ))
          )}
          {copilotLoading && (
            <div className="flex justify-start">
              <span className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-400">
                Checking policy guides...
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleCopilotSubmit} className="p-3 border-t border-slate-100 bg-white flex gap-2 shrink-0">
          <input
            type="text"
            value={copilotInput}
            onChange={(e) => setCopilotInput(e.target.value)}
            placeholder="Ask policy pension guides..."
            className="flex-1 border border-slate-200 rounded-full px-4 py-2.5 text-xs focus:outline-none bg-slate-50"
          />
          <button
            type="submit"
            disabled={copilotLoading}
            className="bg-primary text-white rounded-full px-5 py-2.5 text-xs font-bold hover:bg-primary/95"
          >
            Ask
          </button>
        </form>

      </div>
    </div>
  );
}
