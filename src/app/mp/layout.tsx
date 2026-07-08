"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MpLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/mp/dashboard";

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "🏛️", href: "/mp/dashboard" },
    { id: "issues", label: "Issues", icon: "📋", href: "/mp/issues" },
    { id: "map", label: "Map", icon: "🗺️", href: "/mp/map" },
    { id: "profile", label: "Profile", icon: "👤", href: "/mp/profile" },
  ];

  const getActiveTab = () => {
    if (pathname.includes("/issues")) return "issues";
    if (pathname.includes("/map")) return "map";
    if (pathname.includes("/profile")) return "profile";
    return "dashboard";
  };

  const activeTab = getActiveTab();

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-dvh bg-slate-50 relative font-sans">
      {/* Sidebar (Desktop) / Bottom Nav (Mobile) */}
      <nav className="shrink-0 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex md:flex-col justify-around md:justify-start md:p-6 md:space-y-3 z-10 w-full md:w-64">
        <div className="hidden md:block mb-6">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-primary">VISAKHAPATNAM</span>
          <h1 className="text-base font-black text-slate-900 tracking-tight">MP COMMAND HUB</h1>
        </div>
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex flex-col md:flex-row items-center gap-1.5 md:gap-3 px-4 py-2.5 md:py-3 md:px-5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 w-full justify-center md:justify-start ${
              activeTab === tab.id
                ? "bg-primary text-white shadow-md"
                : "text-slate-400 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        ))}
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header (Mobile only) */}
        <header className="bg-white border-b border-slate-200/80 px-5 py-3.5 shrink-0 flex justify-between items-center md:hidden">
          <div>
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-primary">VISAKHAPATNAM</span>
            <h1 className="text-base font-black text-slate-900 tracking-tight">MP COMMAND HUB</h1>
          </div>
        </header>

        {/* Child Pages */}
        <div className="flex-1 min-h-0 overflow-y-auto relative">
          {children}
        </div>
      </div>
    </div>
  );
}
