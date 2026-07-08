import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MPconnect API",
  description: "People's Priorities Engine — backend API",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="max-w-3xl mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}
