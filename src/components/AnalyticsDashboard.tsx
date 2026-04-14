"use client";

import { useState, useEffect } from "react";
import {
  BarChart3, TrendingUp, PieChart as PieIcon,
  Activity, Database, Layers, BookOpen, Scale,
  MapPin, Tag, Gavel,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from "recharts";

interface AnalyticsData {
  summary: {
    totalJudgments: number;
    uniqueCourts: number;
    uniqueStates: number;
    uniqueCategories: number;
    yearRange: number[];
  };
  casesByCategory: { category: string; count: number; color: string }[];
  casesByCourtLevel: { courtLevel: string; count: number; percentage: number }[];
  casesByState: { state: string; count: number }[];
  casesByYear: { year: number; count: number }[];
  dispositionBreakdown: { name: string; value: number; percentage: number; color: string }[];
  topCitedActs: { act: string; citations: number }[];
  topTags: { tag: string; count: number }[];
  topJudges: { judge: string; cases: number }[];
  categoryDisposition: Record<string, unknown>[];
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/analytics");
        const json = await res.json();
        setData(json);
      } catch { console.error("Failed to fetch analytics"); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-[360px] skeleton rounded-2xl" />)}
        </div>
      </div>
    );
  }
  if (!data) return null;

  const s = data.summary;
  const stats = [
    { label: "Judgments Indexed", value: s.totalJudgments.toLocaleString(), sub: `${s.yearRange[0]}–${s.yearRange[1]}`, icon: Database, gradient: "from-slate-700 to-slate-900" },
    { label: "Courts Covered", value: String(s.uniqueCourts), sub: "Supreme · High · District", icon: Scale, gradient: "from-red-500 to-rose-600" },
    { label: "States & UTs", value: String(s.uniqueStates), sub: "Pan-India coverage", icon: MapPin, gradient: "from-blue-500 to-blue-600" },
    { label: "Case Categories", value: String(s.uniqueCategories), sub: "Criminal, Civil, Constitutional & more", icon: Layers, gradient: "from-emerald-500 to-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] rounded-2xl p-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-50" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white text-lg font-bold">Analytics Dashboard</h2>
              <p className="text-slate-400 text-[13px]">Powered by MongoDB Atlas Charts & Aggregation Framework</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[12px] text-emerald-300 font-semibold">Live Data</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="group bg-white rounded-2xl border border-slate-200/60 p-5 hover:shadow-[var(--shadow-lg)] transition-all animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">{s.label}</p>
              <div className={`w-9 h-9 bg-gradient-to-br ${s.gradient} rounded-xl flex items-center justify-center shadow-md`}>
                <s.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-[32px] font-extrabold text-slate-900 leading-none">{s.value}</p>
            <p className="text-[12px] text-emerald-600 font-medium mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts — Row 1: Category + Disposition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cases by Category */}
        <ChartCard title="Cases by Category" subtitle={`Distribution across ${data.casesByCategory.length} categories`} badge="$group" badgeColor="bg-blue-50 text-blue-700" icon={<BarChart3 className="w-4 h-4 text-blue-500" />}>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={data.casesByCategory} layout="vertical" barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={160} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12, boxShadow: "var(--shadow-lg)" }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Cases">
                {data.casesByCategory.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Disposition Pie */}
        <ChartCard title="Disposition Breakdown" subtitle="Outcome distribution (actual counts)" badge="$group" badgeColor="bg-amber-50 text-amber-700" icon={<PieIcon className="w-4 h-4 text-amber-500" />}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.dispositionBreakdown}
                cx="50%" cy="50%"
                innerRadius={70} outerRadius={110}
                paddingAngle={4} dataKey="value" nameKey="name"
                label={({ name, value, percentage }) => `${name}: ${value} (${percentage}%)`}
                labelLine={{ stroke: "#CBD5E1", strokeWidth: 1 }}
                stroke="none"
              >
                {data.dispositionBreakdown.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {data.dispositionBreakdown.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[12px] text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                {d.name}: <strong>{d.value}</strong>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Charts — Row 2: Year trend + State */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cases by Year */}
        <ChartCard title="Cases by Year" subtitle={`Filing trend ${data.summary.yearRange[0]}–${data.summary.yearRange[1]}`} badge="Time-Series" badgeColor="bg-emerald-50 text-emerald-700" icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.casesByYear}>
              <defs>
                <linearGradient id="yearFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#2563EB" fill="url(#yearFill)" strokeWidth={2.5} name="Judgments" dot={{ r: 4, fill: "#2563EB", stroke: "#fff", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Cases by State */}
        <ChartCard title="Cases by State" subtitle={`Top ${data.casesByState.length} states by volume`} badge="$group" badgeColor="bg-rose-50 text-rose-700" icon={<MapPin className="w-4 h-4 text-rose-500" />}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.casesByState} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="state" tick={{ fontSize: 9, fill: "#94a3b8", angle: -35 }} axisLine={false} tickLine={false} height={60} textAnchor="end" />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
              <Bar dataKey="count" fill="#F43F5E" radius={[6, 6, 0, 0]} name="Cases" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts — Row 3: Top Acts + Top Judges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Cited Acts */}
        <ChartCard title="Top Cited Acts" subtitle="Most frequently invoked legislation" badge="$unwind + $group" badgeColor="bg-violet-50 text-violet-700" icon={<BookOpen className="w-4 h-4 text-violet-500" />}>
          <div className="space-y-2.5 mt-1">
            {data.topCitedActs.map((item, i) => {
              const pct = (item.citations / data.topCitedActs[0].citations) * 100;
              return (
                <div key={i} className="group/bar flex items-center gap-3">
                  <span className="w-5 text-[11px] text-slate-400 font-mono text-right font-bold">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[200px]">{item.act}</span>
                      <span className="text-[11px] text-slate-400 font-mono font-bold">{item.citations}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-violet-500 to-violet-400 h-2 rounded-full transition-all duration-700 group-hover/bar:from-violet-600" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>

        {/* Top Judges */}
        <ChartCard title="Most Active Judges" subtitle="Bench appearances across all cases" badge="$unwind + $sortByCount" badgeColor="bg-indigo-50 text-indigo-700" icon={<Gavel className="w-4 h-4 text-indigo-500" />}>
          <div className="space-y-2.5 mt-1">
            {data.topJudges.map((item, i) => {
              const pct = (item.cases / data.topJudges[0].cases) * 100;
              return (
                <div key={i} className="group/bar flex items-center gap-3">
                  <span className="w-5 text-[11px] text-slate-400 font-mono text-right font-bold">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[220px]">{item.judge}</span>
                      <span className="text-[11px] text-slate-400 font-mono font-bold">{item.cases} cases</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-2 rounded-full transition-all duration-700 group-hover/bar:from-indigo-600" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      {/* Charts — Row 4: Category × Disposition + Tags + Court Level */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category × Disposition stacked bar */}
        <div className="lg:col-span-2">
          <ChartCard title="Category × Disposition" subtitle="Outcome breakdown per category (top 10)" badge="$facet" badgeColor="bg-pink-50 text-pink-700" icon={<Activity className="w-4 h-4 text-pink-500" />}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data.categoryDisposition} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={150} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
                <Bar dataKey="Allowed" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Dismissed" stackId="a" fill="#ef4444" />
                <Bar dataKey="Partly Allowed" stackId="a" fill="#f59e0b" />
                <Bar dataKey="Remanded" stackId="a" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Court Level Donut */}
        <ChartCard title="Court Level Split" subtitle="Case distribution by court tier" badge="$group" badgeColor="bg-cyan-50 text-cyan-700" icon={<Scale className="w-4 h-4 text-cyan-600" />}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data.casesByCourtLevel}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={85}
                paddingAngle={4} dataKey="count" nameKey="courtLevel"
                stroke="none"
              >
                {data.casesByCourtLevel.map((_, i) => (
                  <Cell key={i} fill={["#0F172A", "#2563EB", "#64748B"][i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-1">
            {data.casesByCourtLevel.map((cl, i) => (
              <div key={i} className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: ["#0F172A", "#2563EB", "#64748B"][i] }} />
                  <span className="text-slate-700 font-medium">{cl.courtLevel}</span>
                </div>
                <span className="text-slate-500 font-mono font-bold">{cl.count} <span className="text-slate-400">({cl.percentage}%)</span></span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Charts — Row 5: Top Tags cloud */}
      <ChartCard title="Most Frequent Legal Tags" subtitle={`Top ${data.topTags.length} tags across all judgments`} badge="$unwind + $sortByCount" badgeColor="bg-teal-50 text-teal-700" icon={<Tag className="w-4 h-4 text-teal-500" />}>
        <div className="flex flex-wrap gap-2 mt-2">
          {data.topTags.map((t, i) => {
            const max = data.topTags[0].count;
            const ratio = t.count / max;
            const size = 11 + Math.round(ratio * 5);
            const opacity = 0.5 + ratio * 0.5;
            return (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-all cursor-default"
                style={{ fontSize: `${size}px`, opacity }}
              >
                <span className="font-semibold text-slate-700">{t.tag}</span>
                <span className="text-slate-400 font-mono text-[10px]">({t.count})</span>
              </span>
            );
          })}
        </div>
      </ChartCard>

      {/* Atlas Callout */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 border border-emerald-200/60 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20 flex-shrink-0">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-900 text-[15px]">MongoDB Atlas — The Engine Behind These Insights</h3>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { title: "Atlas Charts", desc: "Embed real-time visualizations directly from your data — no ETL." },
                { title: "Aggregation Framework", desc: "$group, $bucket, $facet pipelines run natively on your data." },
                { title: "Real-Time Triggers", desc: "Change Streams notify dashboards instantly on new judgments." },
              ].map((item, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-emerald-100 hover:shadow-md transition-shadow">
                  <p className="text-[13px] font-bold text-slate-800 mb-1">{item.title}</p>
                  <p className="text-[12px] text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Chart Card wrapper ──────────────────────────── */
function ChartCard({ title, subtitle, badge, badgeColor, icon, children }: {
  title: string; subtitle: string; badge: string; badgeColor: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[var(--shadow-sm)] p-6 hover:shadow-[var(--shadow-md)] transition-shadow">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          {icon}
          <div>
            <h3 className="text-[14px] font-bold text-slate-800">{title}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <span className={`badge ${badgeColor}`}>{badge}</span>
      </div>
      {children}
    </div>
  );
}
