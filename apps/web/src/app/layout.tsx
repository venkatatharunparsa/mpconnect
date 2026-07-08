import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "MPconnect — People's Priorities Engine",
  description:
    "Citizens speak in Telugu; the MP sees ranked, evidence-backed development priorities; nothing counts as done until citizens confirm it.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<div className="min-h-dvh bg-surface" />}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
