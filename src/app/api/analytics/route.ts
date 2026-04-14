import { NextResponse } from "next/server";
import { sampleJudgments, Judgment } from "@/data/judgments";
import { connectToDatabase, isMongoConfigured } from "@/lib/mongodb";

const CATEGORY_COLORS: Record<string, string> = {
  "Criminal - Homicide": "#DC2626",
  "Criminal - Bail": "#F97316",
  "Criminal - Cyber Crime": "#8B5CF6",
  "Criminal - Economic Offences": "#EC4899",
  "Criminal - Sexual Offences": "#BE185D",
  "Constitutional - Fundamental Rights": "#2563EB",
  "Constitutional - Reservation": "#7C3AED",
  "Family - Matrimonial Disputes": "#D946EF",
  "Family - Child Custody": "#F472B6",
  "Commercial - Intellectual Property": "#0891B2",
  "Commercial - Arbitration": "#0D9488",
  "Environmental Law": "#16A34A",
  "Taxation": "#CA8A04",
  "Property Disputes": "#A16207",
  "Labour and Employment": "#EA580C",
  "Consumer Protection": "#4F46E5",
  "Banking and Finance": "#0369A1",
  "Election Law": "#9333EA",
  "Civil - Contract Disputes": "#059669",
  "Administrative Law": "#64748B",
};

const DISPOSITION_COLORS: Record<string, string> = {
  "Allowed": "#22c55e",
  "Dismissed": "#ef4444",
  "Partly Allowed": "#f59e0b",
  "Remanded": "#3b82f6",
};

export async function GET() {
  let judgments: Judgment[];

  if (isMongoConfigured()) {
    try {
      const { db } = await connectToDatabase();
      const docs = await db.collection("judgments").find({}).project({ embedding: 0 }).toArray();
      judgments = docs as unknown as Judgment[];
    } catch (err) {
      console.error("MongoDB analytics failed, fallback:", err);
      judgments = sampleJudgments;
    }
  } else {
    judgments = sampleJudgments;
  }

  const total = judgments.length;

  // ── 1. Cases by Category ──
  const catMap: Record<string, number> = {};
  judgments.forEach((j) => { catMap[j.category] = (catMap[j.category] || 0) + 1; });
  const casesByCategory = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({
      category,
      count,
      color: CATEGORY_COLORS[category] || "#64748B",
    }));

  // ── 2. Cases by Court Level ──
  const courtMap: Record<string, number> = {};
  judgments.forEach((j) => { courtMap[j.courtLevel] = (courtMap[j.courtLevel] || 0) + 1; });
  const casesByCourtLevel = Object.entries(courtMap)
    .sort((a, b) => b[1] - a[1])
    .map(([courtLevel, count]) => ({
      courtLevel,
      count,
      percentage: Math.round((count / total) * 100),
    }));

  // ── 3. Cases by State (top 12) ──
  const stateMap: Record<string, number> = {};
  judgments.forEach((j) => { stateMap[j.state] = (stateMap[j.state] || 0) + 1; });
  const casesByState = Object.entries(stateMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([state, count]) => ({ state, count }));

  // ── 4. Cases by Year ──
  const yearMap: Record<number, number> = {};
  judgments.forEach((j) => { yearMap[j.year] = (yearMap[j.year] || 0) + 1; });
  const casesByYear = Object.entries(yearMap)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([year, count]) => ({ year: Number(year), count }));

  // ── 5. Disposition Breakdown ──
  const dispMap: Record<string, number> = {};
  judgments.forEach((j) => { dispMap[j.disposition] = (dispMap[j.disposition] || 0) + 1; });
  const dispositionBreakdown = Object.entries(dispMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      value: count,
      percentage: Math.round((count / total) * 100),
      color: DISPOSITION_COLORS[name] || "#64748B",
    }));

  // ── 6. Top Cited Acts (flatten & count) ──
  const actMap: Record<string, number> = {};
  judgments.forEach((j) => {
    j.acts.forEach((act) => { actMap[act] = (actMap[act] || 0) + 1; });
  });
  const topCitedActs = Object.entries(actMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([act, citations]) => ({ act, citations }));

  // ── 7. Top Tags (flatten & count) ──
  const tagMap: Record<string, number> = {};
  judgments.forEach((j) => {
    j.tags.forEach((tag) => { tagMap[tag] = (tagMap[tag] || 0) + 1; });
  });
  const topTags = Object.entries(tagMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([tag, count]) => ({ tag, count }));

  // ── 8. Top Judges (flatten bench & count) ──
  const judgeMap: Record<string, number> = {};
  judgments.forEach((j) => {
    j.bench.forEach((judge) => { judgeMap[judge] = (judgeMap[judge] || 0) + 1; });
  });
  const topJudges = Object.entries(judgeMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([judge, cases]) => ({ judge, cases }));

  // ── 9. Category × Disposition heatmap data ──
  const catDispMap: Record<string, Record<string, number>> = {};
  judgments.forEach((j) => {
    if (!catDispMap[j.category]) catDispMap[j.category] = {};
    catDispMap[j.category][j.disposition] = (catDispMap[j.category][j.disposition] || 0) + 1;
  });
  const categoryDisposition = Object.entries(catDispMap)
    .sort((a, b) => {
      const totalA = Object.values(a[1]).reduce((s, v) => s + v, 0);
      const totalB = Object.values(b[1]).reduce((s, v) => s + v, 0);
      return totalB - totalA;
    })
    .slice(0, 10)
    .map(([category, disps]) => ({
      category: category.length > 25 ? category.slice(0, 22) + "..." : category,
      ...disps,
    }));

  // ── 10. Summary stats ──
  const uniqueCourts = new Set(judgments.map((j) => j.court)).size;
  const uniqueStates = new Set(judgments.map((j) => j.state)).size;
  const uniqueCategories = new Set(judgments.map((j) => j.category)).size;
  const yearRange = [Math.min(...judgments.map((j) => j.year)), Math.max(...judgments.map((j) => j.year))];

  return NextResponse.json({
    summary: {
      totalJudgments: total,
      uniqueCourts,
      uniqueStates,
      uniqueCategories,
      yearRange,
    },
    casesByCategory,
    casesByCourtLevel,
    casesByState,
    casesByYear,
    dispositionBreakdown,
    topCitedActs,
    topTags,
    topJudges,
    categoryDisposition,
  });
}
