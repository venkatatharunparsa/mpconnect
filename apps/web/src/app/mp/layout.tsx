import { MPCopilotWidget } from "@/components/mp/MPCopilotWidget";

export default function MpLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <MPCopilotWidget />
    </>
  );
}

