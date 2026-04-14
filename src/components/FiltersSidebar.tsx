"use client";

import { useState } from "react";
import { SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { SearchFilters } from "@/lib/search";

interface FiltersSidebarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

export default function FiltersSidebar({ filters, onFiltersChange }: FiltersSidebarProps) {
  const [open, setOpen] = useState<Record<string, boolean>>({
    courtLevel: true, year: true, disposition: true, category: true,
  });

  const toggle = (key: string) => setOpen(p => ({ ...p, [key]: !p[key] }));

  const handleCourtLevel = (l: string) => {
    const c = filters.courtLevel || [];
    onFiltersChange({ ...filters, courtLevel: c.includes(l) ? c.filter(x => x !== l) : [...c, l] });
  };
  const handleDisposition = (d: string) => {
    const c = filters.disposition || [];
    onFiltersChange({ ...filters, disposition: c.includes(d) ? c.filter(x => x !== d) : [...c, d] });
  };
  const handleCategory = (cat: string) => {
    const c = filters.category || [];
    onFiltersChange({ ...filters, category: c.includes(cat) ? c.filter(x => x !== cat) : [...c, cat] });
  };
  const handleYear = (type: "min" | "max", val: string) => {
    const c = filters.yearRange || [1950, 2024];
    onFiltersChange({ ...filters, yearRange: type === "min" ? [parseInt(val) || 1950, c[1]] : [c[0], parseInt(val) || 2024] });
  };
  const reset = () => onFiltersChange({});

  const hasActive =
    (filters.courtLevel?.length || 0) > 0 ||
    (filters.disposition?.length || 0) > 0 ||
    (filters.category?.length || 0) > 0 ||
    !!filters.yearRange;

  const courts = ["Supreme Court", "High Court", "District Court"];
  const dispositions = [
    { label: "Allowed", color: "bg-emerald-500" },
    { label: "Dismissed", color: "bg-red-500" },
    { label: "Partly Allowed", color: "bg-amber-500" },
    { label: "Remanded", color: "bg-blue-500" },
  ];
  const categories = ["Criminal", "Constitutional", "Family", "Commercial", "Taxation", "Environmental"];

  return (
    <div className="bg-white rounded-2xl shadow-[var(--shadow-sm)] border border-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <span className="text-[13px] font-bold text-slate-800">Filters</span>
            {hasActive && (
              <span className="ml-2 badge bg-emerald-100 text-emerald-700">active</span>
            )}
          </div>
        </div>
        {hasActive && (
          <button onClick={reset} className="flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-600 transition-colors">
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* Court Level */}
      <FilterSection label="Court Level" isOpen={open.courtLevel} onToggle={() => toggle("courtLevel")}>
        <div className="space-y-1">
          {courts.map(court => (
            <Checkbox
              key={court}
              label={court}
              checked={(filters.courtLevel || []).includes(court)}
              onChange={() => handleCourtLevel(court)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Year Range */}
      <FilterSection label="Year Range" isOpen={open.year} onToggle={() => toggle("year")}>
        <div className="flex gap-2 items-center">
          <input
            type="number" min={1950} max={2024} placeholder="From"
            value={filters.yearRange?.[0] || ""}
            onChange={(e) => handleYear("min", e.target.value)}
            className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all bg-slate-50"
          />
          <span className="text-slate-300 text-xs font-bold">—</span>
          <input
            type="number" min={1950} max={2024} placeholder="To"
            value={filters.yearRange?.[1] || ""}
            onChange={(e) => handleYear("max", e.target.value)}
            className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all bg-slate-50"
          />
        </div>
      </FilterSection>

      {/* Disposition */}
      <FilterSection label="Disposition" isOpen={open.disposition} onToggle={() => toggle("disposition")}>
        <div className="space-y-1">
          {dispositions.map(d => (
            <Checkbox
              key={d.label}
              label={d.label}
              checked={(filters.disposition || []).includes(d.label)}
              onChange={() => handleDisposition(d.label)}
              dotColor={d.color}
            />
          ))}
        </div>
      </FilterSection>

      {/* Category */}
      <FilterSection label="Case Category" isOpen={open.category} onToggle={() => toggle("category")} last>
        <div className="space-y-1">
          {categories.map(cat => (
            <Checkbox
              key={cat}
              label={cat}
              checked={(filters.category || []).includes(cat)}
              onChange={() => handleCategory(cat)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Atlas callout */}
      <div className="m-4 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl">
        <p className="text-[11px] font-bold text-emerald-800 mb-0.5">MongoDB Feature</p>
        <p className="text-[11px] text-emerald-700/70 leading-relaxed">
          Facets powered by <strong>Atlas Search</strong> — dynamic aggregation on search results for instant filter counts.
        </p>
      </div>
    </div>
  );
}

/* ── Reusable parts ──────────────────────────────── */
function FilterSection({ label, isOpen, onToggle, children, last }: {
  label: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode; last?: boolean;
}) {
  return (
    <div className={last ? "" : "border-b border-slate-100"}>
      <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-3.5 text-[12px] font-bold text-slate-600 uppercase tracking-wider hover:bg-slate-50 transition-colors">
        {label}
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {isOpen && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
}

function Checkbox({ label, checked, onChange, dotColor }: {
  label: string; checked: boolean; onChange: () => void; dotColor?: string;
}) {
  return (
    <label className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors group">
      <div className={`
        w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center transition-all
        ${checked ? "bg-emerald-500 border-emerald-500" : "border-slate-300 group-hover:border-slate-400"}
      `}>
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span className="text-[13px] text-slate-600 group-hover:text-slate-800 flex items-center gap-1.5 transition-colors">
        {dotColor && <span className={`w-2 h-2 rounded-full ${dotColor}`} />}
        {label}
      </span>
    </label>
  );
}
