"use client";

import { useState, useRef, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";

interface ChatbotPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatbotPanel({ isOpen, onClose }: ChatbotPanelProps) {
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "model"; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isOpen]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const userText = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: userText }]);
    setChatLoading(true);

    try {
      const res = await apiFetch("/api/mp/chat", {
        method: "POST",
        body: JSON.stringify({ message: userText }),
      });
      if (res.ok) {
        const body = await res.json();
        setChatMessages((prev) => [...prev, { role: "model", text: body.answer }]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: "model", text: "I encountered an error querying the database." },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "model", text: "Connection error. Unable to query assistant." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg h-[580px] border border-slate-200 flex flex-col overflow-hidden shadow-2xl animate-fade-in">
        
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">✨ Gemini DB Assistant</h4>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Live database statistics querying</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 text-sm font-black p-1.5"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50">
          {chatMessages.length === 0 ? (
            <div className="text-center py-8 text-[10px] text-slate-400 space-y-3">
              <p>Ask live ward or unresolved complaint counts:</p>
              <div className="flex flex-col gap-1.5 max-w-xs mx-auto">
                {[
                  "How many unresolved streetlight complaints in Gajuwaka?",
                  "Give me GVMC statistics summary.",
                ].map((x) => (
                  <button
                    key={x}
                    onClick={() => setChatInput(x)}
                    className="w-full text-left bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-600 font-semibold"
                  >
                    {x}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <span className={`rounded-xl px-4 py-2.5 text-xs max-w-[85%] leading-relaxed ${
                  msg.role === "user" ? "bg-primary text-white font-bold" : "bg-white border border-slate-200 text-slate-800"
                }`}>
                  {msg.text}
                </span>
              </div>
            ))
          )}
          {chatLoading && (
            <div className="flex justify-start">
              <span className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-400 flex items-center gap-1.5">
                🌀 Querying database...
              </span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleChatSubmit} className="p-3 border-t border-slate-100 bg-white flex gap-2 shrink-0">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask water, road or streetlight metrics..."
            className="flex-1 border border-slate-200 rounded-full px-4 py-2.5 text-xs focus:outline-none bg-slate-50"
          />
          <button
            type="submit"
            disabled={chatLoading}
            className="bg-primary text-white rounded-full px-5 py-2.5 text-xs font-bold hover:bg-primary/95"
          >
            Ask
          </button>
        </form>

      </div>
    </div>
  );
}
