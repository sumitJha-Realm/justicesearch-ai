"use client";

import { useState } from "react";
import { Judgment } from "@/data/judgments";
import {
  BookOpen, Calendar, MapPin, Scale, Users, ExternalLink,
  ChevronDown, ChevronUp, GitBranch, Hash, FileText, ArrowUpRight
} from "lucide-react";

interface ResultCardProps {
  judgment: Judgment;
  rank: number;
}

export default function ResultCard({ judgment, rank }: ResultCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showPrecedentMap, setShowPrecedentMap] = useState(false);

  const score = judgment.matchScore || 0;
  const scoreGradient = score >= 70
    ? "from-emerald-500 to-emerald-600"
    : score >= 40
    ? "from-amber-500 to-orange-500"
    : "from-slate-400 to-slate-500";

  const dispStyle: Record<string, string> = {
    "Allowed": "bg-emerald-50 text-emerald-700 ring-emerald-200",
    "Dismissed": "bg-red-50 text-red-700 ring-red-200",
    "Partly Allowed": "bg-amber-50 text-amber-700 ring-amber-200",
    "Remanded": "bg-blue-50 text-blue-700 ring-blue-200",
  };

  const renderSnippet = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1
        ? <span key={i} className="search-highlight">{part}</span>
        : <span key={i}>{part}</span>
    );
  };

  return (
    <div className="result-card bg-white rounded-2xl border border-slate-200/60 shadow-[var(--shadow-sm)] overflow-hidden animate-fade-in-up">
      <div className="p-5 sm:p-6">
        <div className="flex gap-4">
          {/* Score circle */}
          <div className="flex-shrink-0 hidden sm:block">
            <div className={`score-badge w-[58px] h-[58px] rounded-2xl bg-gradient-to-br ${scoreGradient} flex flex-col items-center justify-center text-white shadow-lg`}>
              <span className="text-[20px] font-extrabold leading-none">{score}</span>
              <span className="text-[9px] font-semibold opacity-80 mt-0.5">MATCH</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge bg-slate-100 text-slate-500">#{rank}</span>
                  <span className={`badge ring-1 ${dispStyle[judgment.disposition] || "bg-slate-50 text-slate-600"}`}>
                    {judgment.disposition}
                  </span>
                </div>
                <h3 className="text-[15px] font-bold text-slate-900 leading-snug">
                  {judgment.caseTitle}
                </h3>
              </div>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-slate-500 mb-3">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                {judgment.caseNumber}
              </span>
              <span className="flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-slate-400" />
                {judgment.court}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(judgment.dateOfJudgment).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {judgment.district}, {judgment.state}
              </span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="badge bg-[#0F172A] text-white">
                {judgment.category}
              </span>
              {judgment.tags.slice(0, 3).map((tag, i) => (
                <span key={i} className="badge bg-slate-100 text-slate-600">
                  <Hash className="w-2.5 h-2.5" />{tag}
                </span>
              ))}
            </div>

            {/* Smart Snippet */}
            <div className="p-4 bg-amber-50/60 border border-amber-200/40 rounded-xl">
              <p className="text-[11px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Smart Snippet
              </p>
              <p className="text-[13px] text-amber-900/80 leading-relaxed">
                {renderSnippet(judgment.snippet)}
              </p>
            </div>

            {/* Acts & Sections */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {judgment.acts.map((act, i) => (
                <span key={i} className="text-[11px] bg-violet-50 text-violet-700 font-semibold px-2.5 py-0.5 rounded-lg ring-1 ring-violet-200/60">
                  {act}
                </span>
              ))}
              {judgment.sections.slice(0, 3).map((sec, i) => (
                <span key={i} className="text-[11px] bg-slate-50 text-slate-500 px-2.5 py-0.5 rounded-lg">
                  {sec}
                </span>
              ))}
            </div>

            {/* Bench */}
            <div className="flex items-center gap-1.5 mt-2 text-[12px] text-slate-400">
              <Users className="w-3.5 h-3.5" />
              {judgment.bench.join(", ")}
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-5 sm:px-6 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center gap-1">
        <ActionButton onClick={() => setExpanded(!expanded)}
          icon={expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          label={expanded ? "Hide" : "Full Text"} />
        <ActionButton onClick={() => setShowPrecedentMap(!showPrecedentMap)}
          icon={<GitBranch className="w-3.5 h-3.5" />}
          label="Precedent Map" />
        <div className="flex-1" />
        <button className="flex items-center gap-1 text-[12px] text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg hover:bg-white transition-all">
          <ExternalLink className="w-3.5 h-3.5" /> PDF
        </button>
      </div>

      {/* Expanded: Full Text */}
      {expanded && (
        <div className="px-5 sm:px-6 py-5 border-t border-slate-100 bg-slate-50/40 animate-fade-in-up">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Full Judgment Text
          </h4>
          <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-line">
            {judgment.fullText}
          </p>
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[12px] text-emerald-700">
            <strong>MongoDB Feature:</strong> Full text stored as a flexible document. A 1970s case may have different metadata fields than a 2024 e-filing — MongoDB&apos;s document model handles both seamlessly.
          </div>
        </div>
      )}

      {/* Expanded: Precedent Map */}
      {showPrecedentMap && (
        <div className="px-5 sm:px-6 py-5 border-t border-slate-100 bg-violet-50/30 animate-fade-in-up">
          <h4 className="text-[11px] font-bold text-violet-600 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5" /> Precedent Map
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <PrecedentColumn
              title="Cited By" count={judgment.citedBy.length} color="emerald"
              items={judgment.citedBy.map(id => `Case Ref: ${id}`)}
            />
            <PrecedentColumn
              title="Cites To" count={judgment.citesTo.length} color="blue"
              items={judgment.citesTo}
            />
          </div>
          <div className="mt-4 p-3 bg-violet-50 border border-violet-100 rounded-xl text-[12px] text-violet-700">
            <strong>MongoDB Feature:</strong> Precedent relationships stored as embedded arrays, resolved with <code className="bg-violet-100 px-1 py-0.5 rounded text-[11px]">$lookup</code> aggregations — no JOINs needed.
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-[#0F172A] px-3 py-1.5 rounded-lg hover:bg-white transition-all"
    >
      {icon} {label}
    </button>
  );
}

function PrecedentColumn({ title, count, color, items }: {
  title: string; count: number; color: "emerald" | "blue"; items: string[];
}) {
  const dotClass = color === "emerald" ? "bg-emerald-500" : "bg-blue-500";
  return (
    <div>
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
        {title} <span className="text-slate-400">({count})</span>
      </p>
      {items.length > 0 ? (
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-[12px] bg-white p-2.5 rounded-lg border border-slate-100">
              <span className={`w-1.5 h-1.5 ${dotClass} rounded-full flex-shrink-0`} />
              <span className="text-slate-600 truncate">{item}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[12px] text-slate-400 italic">No citations found</p>
      )}
    </div>
  );
}
