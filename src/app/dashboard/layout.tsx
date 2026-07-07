export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 top-14 z-0 flex flex-col overflow-hidden bg-slate-50">
      {children}
    </div>
  );
}
