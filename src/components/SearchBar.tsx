"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Sparkles, Type, Brain, X, ArrowRight, Zap, ChevronRight } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string, mode: "keyword" | "semantic") => void;
  onVectorSearch: (text: string) => void;
  isLoading: boolean;
}

export default function SearchBar({ onSearch, onVectorSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"keyword" | "semantic">("keyword");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showVectorInput, setShowVectorInput] = useState(false);
  const [vectorText, setVectorText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); return; }
    try {
      const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch { setSuggestions([]); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchSuggestions(query), 200);
    return () => clearTimeout(timer);
  }, [query, fetchSuggestions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) { onSearch(query.trim(), mode); setShowSuggestions(false); }
  };

  const handleVectorSubmit = () => {
    if (vectorText.trim()) { onVectorSearch(vectorText.trim()); setShowVectorInput(false); }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion, mode);
  };

  const demoQueries = [
    { label: 'Fuzzy: "Hormocide"', query: "hormocide", icon: "~" },
    { label: 'Synonym: "Divorce"', query: "divorce", icon: "=" },
    { label: "Privacy Rights", query: "right to privacy digital surveillance", icon: "#" },
    { label: "Bail in NDPS", query: "bail NDPS speedy trial", icon: "!" },
    { label: "Cyber Fraud", query: "online fraud phishing identity theft", icon: "@" },
    { label: "Land Dispute", query: "property title possession eviction", icon: "&" },
  ];

  const vectorExamples = [
    {
      label: "Murder — Sudden Provocation",
      text: "The accused killed the deceased during a heated argument over a land boundary dispute. There was no prior planning. The accused grabbed a nearby iron rod and struck the victim on the head in a fit of rage after being abused by the deceased. The accused immediately surrendered to police.",
    },
    {
      label: "Bail — Long Custody, No Trial",
      text: "The applicant, a daily wage labourer, has been in judicial custody for 3 years for possession of 50 grams of cannabis. The chargesheet was filed but not a single prosecution witness has been examined. The applicant has no prior criminal record and has roots in the community.",
    },
    {
      label: "Digital Privacy vs State Surveillance",
      text: "The government issued an order mandating telecom companies to install deep packet inspection equipment to monitor all internet traffic. No independent judicial oversight was provided. Citizens argue this violates their right to privacy and chills free speech online.",
    },
    {
      label: "Employer Fired Without Notice",
      text: "A factory worker employed for 12 years was terminated without any notice or inquiry. The management claims misconduct but no domestic enquiry was conducted. The worker was not given any opportunity to explain his conduct before termination.",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Mode Switcher — pill style */}
      <div className="flex flex-wrap items-center gap-2">
        <ModeButton
          active={mode === "keyword" && !showVectorInput}
          onClick={() => { setMode("keyword"); setShowVectorInput(false); }}
          icon={<Type className="w-3.5 h-3.5" />}
          label="Keyword"
          badge="Atlas Search"
          badgeColor="bg-emerald-500/10 text-emerald-600"
        />
        <ModeButton
          active={mode === "semantic" && !showVectorInput}
          onClick={() => { setMode("semantic"); setShowVectorInput(false); }}
          icon={<Sparkles className="w-3.5 h-3.5" />}
          label="Semantic"
          badge="+ Synonyms"
          badgeColor="bg-violet-500/10 text-violet-600"
        />
        <ModeButton
          active={showVectorInput}
          onClick={() => setShowVectorInput(!showVectorInput)}
          icon={<Brain className="w-3.5 h-3.5" />}
          label="AI Precedent Finder"
          badge="Vector Search"
          badgeColor="bg-amber-500/10 text-amber-700"
        />
      </div>

      {/* Search Input Card */}
      <div className="bg-white rounded-2xl shadow-[var(--shadow-lg)] border border-slate-200/60 overflow-hidden">
        {!showVectorInput ? (
          <>
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex items-center">
                <div className="pl-5">
                  <Search className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder={
                    mode === "keyword"
                      ? 'Search by case name, act, section, or keyword...'
                      : 'Search by legal concept or principle...'
                  }
                  className="flex-1 px-4 py-5 text-[15px] text-slate-800 placeholder:text-slate-400 bg-transparent outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => { setQuery(""); setSuggestions([]); }}
                    className="p-2 mr-1 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="flex items-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-40 disabled:cursor-not-allowed text-white pl-5 pr-6 py-3 mr-3 rounded-xl text-[13px] font-semibold transition-all active:scale-[0.97]"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Search
                </button>
              </div>

              {/* Autocomplete dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 bg-white border-t border-slate-100 shadow-[var(--shadow-xl)] rounded-b-2xl z-50 overflow-hidden"
                >
                  {suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-5 py-3 hover:bg-slate-50 flex items-center gap-3 text-[13px] border-b border-slate-50 last:border-0 transition-colors"
                    >
                      <Search className="w-4 h-4 text-slate-300 flex-shrink-0" />
                      <span className="text-slate-700 truncate flex-1">{suggestion}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* Quick demos */}
            <div className="px-5 pb-4 pt-1 flex flex-wrap items-center gap-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mr-1">Try:</span>
              {demoQueries.map((dq, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(dq.query); onSearch(dq.query, mode); }}
                  className="group flex items-center gap-1.5 text-[12px] bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 pl-2.5 pr-3 py-1.5 rounded-lg transition-all border border-transparent hover:border-slate-200"
                >
                  <span className="w-5 h-5 rounded bg-slate-200/60 group-hover:bg-slate-300/60 flex items-center justify-center text-[10px] font-mono font-bold text-slate-500 transition-colors">
                    {dq.icon}
                  </span>
                  {dq.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          /* Vector Search — Paste paragraph input */
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2.5 text-[13px] text-violet-700 bg-violet-50 px-4 py-2.5 rounded-xl border border-violet-100">
              <Brain className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>AI Precedent Finder</strong> — Paste a case summary to discover similar historical judgments using Vector Search
              </span>
            </div>
            <textarea
              value={vectorText}
              onChange={(e) => setVectorText(e.target.value)}
              placeholder={"Paste a case summary or describe the legal situation...\n\nExample: 'The accused killed the deceased during a heated argument over a land boundary dispute. There was no prior planning. The accused grabbed a nearby iron rod and struck the victim in a fit of rage.'"}
              className="w-full h-40 px-4 py-3.5 rounded-xl border-2 border-violet-200 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 bg-white text-slate-800 placeholder:text-slate-400 text-[14px] resize-none transition-all outline-none"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleVectorSubmit}
                disabled={isLoading || !vectorText.trim()}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white px-6 py-3 rounded-xl text-[13px] font-semibold transition-all active:scale-[0.97]"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Find Similar Precedents
              </button>
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">or try:</span>
              {vectorExamples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => { setVectorText(ex.text); }}
                  className="text-[12px] bg-violet-50 hover:bg-violet-100 text-violet-600 hover:text-violet-800 px-3 py-1.5 rounded-lg transition-all border border-violet-200/50 hover:border-violet-300 font-medium"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Mode toggle button ──────────────────────────────── */
function ModeButton({
  active, onClick, icon, label, badge, badgeColor,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode;
  label: string; badge: string; badgeColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all border
        ${active
          ? "bg-white text-[#0F172A] border-slate-200 shadow-[var(--shadow-md)]"
          : "bg-transparent text-slate-500 border-transparent hover:bg-white/60 hover:border-slate-200/50"
        }
      `}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      <span className={`badge ${badgeColor}`}>{badge}</span>
    </button>
  );
}
