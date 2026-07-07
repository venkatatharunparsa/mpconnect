import { useCallback, useEffect } from "react";
import { t, type Lang } from "./i18n";

export type VerificationMsg = {
  id: string;
  role: "bot";
  kind: "verification";
  verificationId: number;
  demandTitle: string;
  text: string;
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Poll pending verifications every 30s and surface inline confirm/deny prompts. */
export function useVerificationPoll(
  citizenKey: string,
  lang: Lang,
  setMessages: React.Dispatch<React.SetStateAction<Array<{ kind?: string; verificationId?: number } & VerificationMsg>>>,
) {
  const fetchVerifications = useCallback(async () => {
    if (!citizenKey) return;
    const res = await fetch(`/api/verifications?citizenKey=${encodeURIComponent(citizenKey)}`);
    if (!res.ok) return;
    const pending = (await res.json()) as Array<{ id: number; demandTitle: string }>;

    setMessages((prev) => {
      const existing = new Set(
        prev.filter((m) => m.kind === "verification").map((m) => m.verificationId),
      );
      const additions = pending
        .filter((v) => !existing.has(v.id))
        .map(
          (v): VerificationMsg => ({
            id: uid(),
            role: "bot",
            kind: "verification",
            verificationId: v.id,
            demandTitle: v.demandTitle,
            text: t(lang, "verificationPrompt", { title: v.demandTitle }),
          }),
        );
      return additions.length ? [...prev, ...additions] : prev;
    });
  }, [citizenKey, lang, setMessages]);

  useEffect(() => {
    if (!citizenKey) return;
    fetchVerifications();
    const iv = setInterval(fetchVerifications, 30_000);
    return () => clearInterval(iv);
  }, [citizenKey, fetchVerifications]);
}
