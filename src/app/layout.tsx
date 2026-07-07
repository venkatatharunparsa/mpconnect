import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MPconnect — People's Priorities Engine",
  description:
    "Citizens speak in Telugu; the MP sees ranked, evidence-backed development priorities; nothing counts as done until citizens confirm it.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-primary text-white px-4 py-3 flex items-center gap-6 text-sm">
          <Link href="/" className="font-bold text-base tracking-tight">
            MPconnect
          </Link>
          <Link href="/submit">Submit (చెప్పండి)</Link>
          <Link href="/voice">Voice agent</Link>
          <Link href="/dashboard">MP dashboard</Link>
          <Link href="/review">Review</Link>
          <Link href="/vision">Vision</Link>
        </nav>
        <main className="max-w-6xl mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}
