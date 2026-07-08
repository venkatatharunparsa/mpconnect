export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[calc(100dvh-4rem)] flex-col lg:min-h-[calc(100dvh-5rem)]">{children}</div>;
}
