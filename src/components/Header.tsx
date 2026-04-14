"use client";


import { Scale, Database, Search, BarChart3, Upload } from "lucide-react";

interface HeaderProps {
  activeTab: "search" | "analytics";
  onTabChange: (tab: "search" | "analytics") => void;
  onIngestClick: () => void;
  docCount?: number | null;
}

export default function Header({ activeTab, onTabChange, onIngestClick, docCount }: HeaderProps) {

  return (
    <header className="sticky top-0 z-50 bg-[#0F172A] shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Top row */}
        <div className="flex items-center justify-between h-[64px]">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0F172A]" />
            </div>
            <div>
              <h1 className="text-[18px] font-bold text-white tracking-tight leading-none">
                JusticeSearch<span className="text-emerald-400">.ai</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                JUDICIAL RESEARCH PORTAL
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onIngestClick}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 hover:border-orange-400/50 px-3.5 py-1.5 rounded-full transition-all hover:shadow-lg hover:shadow-orange-500/10 group"
            >
              <Upload className="w-3.5 h-3.5 text-orange-400 group-hover:text-orange-300 transition-colors" />
              <span className="text-[12px] text-orange-300 font-semibold group-hover:text-orange-200 transition-colors">Ingest PDF</span>
            </button>
            <div className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] px-3.5 py-1.5 rounded-full">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[12px] text-slate-300 font-medium">MongoDB Atlas</span>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-[12px] text-emerald-300 font-semibold">{docCount ? docCount.toLocaleString() : "..."} Judgments</span>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 -mb-px">
          <TabButton
            active={activeTab === "search"}
            onClick={() => onTabChange("search")}
            icon={<Search className="w-4 h-4" />}
            label="Judgment Search"
          />
          <TabButton
            active={activeTab === "analytics"}
            onClick={() => onTabChange("analytics")}
            icon={<BarChart3 className="w-4 h-4" />}
            label="Analytics Dashboard"
          />
        </div>
      </div>
    </header>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-2 px-5 py-3 text-[13px] font-semibold rounded-t-lg transition-all
        ${active
          ? "bg-[#F8FAFC] text-[#0F172A] shadow-[0_-2px_8px_rgba(0,0,0,0.1)]"
          : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
        }
      `}
    >
      {icon}
      {label}
      {active && (
        <span className="absolute top-0 left-4 right-4 h-[2px] bg-emerald-500 rounded-b" />
      )}
    </button>
  );
}
