"use client";

import { useState, useCallback } from "react";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import FiltersSidebar from "@/components/FiltersSidebar";
import ResultCard from "@/components/ResultCard";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import QueryMetrics, { QueryMetricsData } from "@/components/QueryMetrics";
import { Judgment } from "@/data/judgments";
import { SearchFilters } from "@/lib/search";
import {
  Clock, Search, Sparkles, AlertCircle, Brain, Lightbulb,
  Database, Zap, Shield, GitBranch, ChevronRight,
} from "lucide-react";

interface SearchResultState {
  results: Judgment[];
  totalResults: number;
  searchTime: number;
  correctedQuery?: string;
  expandedTerms?: string[];
  searchMode: "keyword" | "semantic";
  metrics?: QueryMetricsData;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"search" | "analytics">("search");
  const [searchResults, setSearchResults] = useState<SearchResultState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [lastQuery, setLastQuery] = useState("");
  const [lastMode, setLastMode] = useState<"keyword" | "semantic">("keyword");

  const handleSearch = useCallback(async (query: string, mode: "keyword" | "semantic") => {
    setIsLoading(true); setLastQuery(query); setLastMode(mode);
    try {
      const params = new URLSearchParams({ q: query, mode });
      if (filters.courtLevel?.length) params.set("courtLevel", filters.courtLevel.join(","));
      if (filters.yearRange) { params.set("yearMin", filters.yearRange[0].toString()); params.set("yearMax", filters.yearRange[1].toString()); }
      if (filters.disposition?.length) params.set("disposition", filters.disposition.join(","));
      if (filters.category?.length) params.set("category", filters.category.join(","));
      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      setSearchResults(data);
    } catch { console.error("Search failed"); }
    finally { setIsLoading(false); }
  }, [filters]);

  const handleVectorSearch = useCallback(async (text: string) => {
    setIsLoading(true); setLastQuery("AI Precedent Search"); setLastMode("semantic");
    try {
      const res = await fetch("/api/vector-search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setSearchResults({
        results: data.results,
        totalResults: data.totalResults,
        searchTime: data.searchTime,
        searchMode: "semantic",
        metrics: data.metrics,
      });
    } catch { console.error("Vector search failed"); }
    finally { setIsLoading(false); }
  }, []);

  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
    if (lastQuery && lastQuery !== "AI Precedent Search") {
      setTimeout(() => handleSearch(lastQuery, lastMode), 100);
    }
  }, [lastQuery, lastMode, handleSearch]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8">
        {activeTab === "search" ? (
          <div className="space-y-6">
            <SearchBar onSearch={handleSearch} onVectorSearch={handleVectorSearch} isLoading={isLoading} />

            {searchResults ? (
              <div className="space-y-5">
                {/* ━━━ QUERY METRICS PANEL ━━━ */}
                {searchResults.metrics && (
                  <QueryMetrics metrics={searchResults.metrics} />
                )}

                <div className="flex gap-6">
                  {/* Sidebar */}
                  <aside className="hidden lg:block w-[280px] flex-shrink-0">
                    <div className="sticky top-[120px]">
                      <FiltersSidebar filters={filters} onFiltersChange={handleFiltersChange} />
                    </div>
                  </aside>

                  {/* Results */}
                  <div className="flex-1 min-w-0 space-y-4">
                    {/* Meta row */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-[14px] text-slate-600">
                        <span className="font-bold text-slate-900">{searchResults.totalResults}</span> results
                        {lastQuery && <> for <span className="font-bold text-slate-900">&quot;{lastQuery}&quot;</span></>}
                      </p>
                      <span className="text-[12px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />{searchResults.searchTime}ms
                      </span>
                      <span className={`badge ${
                        searchResults.searchMode === "semantic"
                          ? "bg-violet-100 text-violet-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {searchResults.searchMode === "semantic" ? "Semantic" : "Keyword"}
                      </span>
                    </div>

                    {/* Fuzzy banner */}
                    {searchResults.correctedQuery && (
                      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200/60 rounded-2xl animate-fade-in-up">
                        <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-[13px] text-amber-800">
                            <strong>Atlas Search — Fuzzy Match:</strong> Showing results for
                            <span className="font-bold text-amber-900 mx-1">&quot;{searchResults.correctedQuery}&quot;</span>
                            instead of <span className="line-through opacity-50">&quot;{lastQuery}&quot;</span>
                          </p>
                          <p className="text-[11px] text-amber-600/70 mt-1">Uses Levenshtein distance ≤ 2 for fuzzy matching.</p>
                        </div>
                      </div>
                    )}

                    {/* Synonym banner */}
                    {searchResults.expandedTerms && searchResults.expandedTerms.length > 0 && (
                      <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-200/60 rounded-2xl animate-fade-in-up">
                        <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-violet-600" />
                        </div>
                        <div>
                          <p className="text-[13px] text-violet-800"><strong>Synonym Expansion:</strong> Also searching for</p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {searchResults.expandedTerms.map((term, i) => (
                              <span key={i} className="badge bg-violet-100 text-violet-700">{term}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Result Cards */}
                    {searchResults.results.length > 0 ? (
                      <div className="space-y-4">
                        {searchResults.results.map((judgment, i) => (
                          <ResultCard key={judgment._id} judgment={judgment} rank={i + 1} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/60">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Search className="w-7 h-7 text-slate-400" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">No results found</h3>
                        <p className="text-[13px] text-slate-500 mt-1">Try adjusting your search terms or filters</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* ── Landing ── */
              <LandingContent />
            )}
          </div>
        ) : (
          <AnalyticsDashboard />
        )}
      </main>

      <footer className="bg-[#0F172A] text-slate-500 text-[12px] py-5 mt-auto">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            <span>JusticeSearch AI — MongoDB Atlas Demo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Database className="w-3 h-3 text-emerald-500" />
            Atlas Search · Vector Search · Charts · Voyage AI
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Landing page ── */
function LandingContent() {
  return (
    <div className="mt-4 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Search, gradient: "from-emerald-500 to-emerald-600", shadow: "shadow-emerald-500/20", title: "Atlas Search", sub: "Fuzzy Matching", desc: 'Type "Hormocide" and find "Homicide" — no exact spelling needed.', num: "01" },
          { icon: Brain, gradient: "from-violet-500 to-violet-600", shadow: "shadow-violet-500/20", title: "Vector Search", sub: "Semantic Discovery", desc: "Paste a case summary and find similar precedents by legal meaning.", num: "02" },
          { icon: GitBranch, gradient: "from-blue-500 to-blue-600", shadow: "shadow-blue-500/20", title: "Document Model", sub: "Flexible Schema", desc: "1970s and 2024 cases coexist — no rigid schema constraints.", num: "03" },
          { icon: Zap, gradient: "from-amber-500 to-orange-500", shadow: "shadow-amber-500/20", title: "Atlas Charts", sub: "Real-Time Analytics", desc: "Live dashboards showing pendency, top acts, and filing trends.", num: "04" },
        ].map((f, i) => (
          <div key={i} className={`bg-white rounded-2xl border border-slate-200/60 p-6 hover:shadow-[var(--shadow-lg)] transition-all animate-fade-in-up animate-delay-${i + 1} group`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-11 h-11 bg-gradient-to-br ${f.gradient} rounded-xl flex items-center justify-center shadow-lg ${f.shadow}`}>
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-[32px] font-extrabold text-slate-100 group-hover:text-slate-200 transition-colors">{f.num}</span>
            </div>
            <h4 className="text-[14px] font-bold text-slate-900">{f.title}</h4>
            <p className="text-[12px] font-semibold text-emerald-600 mb-2">{f.sub}</p>
            <p className="text-[12px] text-slate-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[var(--shadow-sm)] p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-[15px]">Demo Walkthrough</h3>
            <p className="text-[12px] text-slate-500">Try these scenarios — watch the Query Inspector panel for live metrics</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { step: 1, color: "bg-emerald-500", title: 'Fuzzy Search: Type "Hormocide"', desc: "See fuzzy correction + pipeline in the Query Inspector." },
            { step: 2, color: "bg-violet-500", title: 'Synonym Expansion: Search "Divorce"', desc: "See synonym expansion and expanded terms in metrics." },
            { step: 3, color: "bg-blue-500", title: "AI Precedent Finder", desc: "See Voyage AI voyage-law-2 embedding + $vectorSearch pipeline." },
            { step: 4, color: "bg-amber-500", title: "Analytics Dashboard", desc: "Click the Analytics tab for live aggregation charts." },
          ].map((d, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-xl hover:bg-slate-50 transition-colors">
              <div className={`${d.color} w-8 h-8 rounded-xl flex items-center justify-center text-white text-[13px] font-extrabold flex-shrink-0 shadow-md`}>{d.step}</div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-slate-800 flex items-center gap-1.5">{d.title} <ChevronRight className="w-3.5 h-3.5 text-slate-400" /></p>
                <p className="text-[12px] text-slate-500 mt-0.5">{d.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] rounded-2xl p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-50" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">MongoDB Atlas Architecture</h3>
              <p className="text-slate-400 text-[13px]">The engine powering this demo</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Data Layer", items: ["Atlas Cluster (M0 Free)", "Flexible Document Model", "1,000+ judgments + embeddings"] },
              { title: "Search & AI Layer", items: ["Atlas Search (Lucene)", "Voyage AI voyage-law-2", "Vector Search (1024-dim)"] },
              { title: "Analytics Layer", items: ["Aggregation ($group, $facet)", "Atlas Charts (embeddable)", "Change Streams"] },
            ].map((block, i) => (
              <div key={i} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5 hover:bg-white/[0.06] transition-colors">
                <h4 className="text-emerald-400 font-bold text-[13px] mb-3 uppercase tracking-wider">{block.title}</h4>
                <ul className="space-y-2">
                  {block.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-[12px] text-slate-400">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0" />{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
