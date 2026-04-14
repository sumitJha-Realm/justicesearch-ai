import { NextRequest, NextResponse } from "next/server";
import { performSearch, SearchFilters } from "@/lib/search";
import { connectToDatabase, isMongoConfigured } from "@/lib/mongodb";
import { Judgment } from "@/data/judgments";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";
  const mode = (searchParams.get("mode") as "keyword" | "semantic") || "keyword";

  const filters: SearchFilters = {};
  const courtLevel = searchParams.get("courtLevel");
  if (courtLevel) filters.courtLevel = courtLevel.split(",");
  const yearMin = searchParams.get("yearMin");
  const yearMax = searchParams.get("yearMax");
  if (yearMin && yearMax) filters.yearRange = [parseInt(yearMin), parseInt(yearMax)];
  const disposition = searchParams.get("disposition");
  if (disposition) filters.disposition = disposition.split(",");
  const category = searchParams.get("category");
  if (category) filters.category = category.split(",");

  if (!query) {
    return NextResponse.json({ results: [], totalResults: 0, searchTime: 0, searchMode: mode });
  }

  // Try MongoDB Atlas first
  if (isMongoConfigured()) {
    try {
      const result = await mongoSearch(query, mode, filters);
      return NextResponse.json(result);
    } catch (err) {
      console.error("MongoDB search failed, falling back to in-memory:", err);
    }
  }

  // Fallback: in-memory search on 12 sample judgments
  const result = performSearch(query, mode, filters);
  return NextResponse.json({
    ...result,
    metrics: {
      query, searchMode: mode,
      engine: "In-Memory (fallback)",
      totalResults: result.totalResults,
      searchTime: result.searchTime,
      correctedQuery: result.correctedQuery,
      expandedTerms: result.expandedTerms,
      fuzzyDistance: result.correctedQuery ? 2 : 0,
      database: "in-memory", collection: "sampleJudgments",
      indexUsed: "none",
      pipelineStages: ["fuzzyMatch", "synonymExpansion", "scoreCalc"],
    },
  });
}

async function mongoSearch(query: string, mode: string, filters: SearchFilters) {
  const startTime = performance.now();
  const { db } = await connectToDatabase();
  const collection = db.collection("judgments");

  // Build MongoDB text search filter
  const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const regex = searchTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const textFilter = {
    $or: [
      { caseTitle: { $regex: regex, $options: "i" } },
      { headnotes: { $regex: regex, $options: "i" } },
      { fullText: { $regex: regex, $options: "i" } },
      { category: { $regex: regex, $options: "i" } },
      { tags: { $regex: regex, $options: "i" } },
      { acts: { $regex: regex, $options: "i" } },
      { sections: { $regex: regex, $options: "i" } },
      { snippet: { $regex: regex, $options: "i" } },
    ],
  };

  // Apply additional filters
  const matchFilters: Record<string, unknown>[] = [textFilter];
  if (filters.courtLevel?.length) matchFilters.push({ courtLevel: { $in: filters.courtLevel } });
  if (filters.yearRange) matchFilters.push({ year: { $gte: filters.yearRange[0], $lte: filters.yearRange[1] } });
  if (filters.disposition?.length) matchFilters.push({ disposition: { $in: filters.disposition } });
  if (filters.category?.length) {
    const catRegex = filters.category.map(c => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    matchFilters.push({ category: { $regex: catRegex, $options: "i" } });
  }

  const results = await collection
    .find({ $and: matchFilters })
    .project({ embedding: 0 })
    .limit(50)
    .toArray();

  // Score results based on match quality
  const scored = results.map((doc) => {
    let score = 0;
    const d = doc as unknown as Judgment;
    for (const term of searchTerms) {
      const tl = term.toLowerCase();
      if (d.caseTitle?.toLowerCase().includes(tl)) score += 30;
      if (d.headnotes?.toLowerCase().includes(tl)) score += 25;
      if (d.tags?.some((t: string) => t.toLowerCase().includes(tl))) score += 20;
      if (d.acts?.some((a: string) => a.toLowerCase().includes(tl))) score += 15;
      if (d.fullText?.toLowerCase().includes(tl)) score += 10;
    }
    return { ...doc, _id: doc.sourceId || doc._id?.toString(), matchScore: Math.min(Math.round(score / searchTerms.length), 99) };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);
  if (mode === "semantic") scored.forEach(r => { r.matchScore = Math.min(r.matchScore + 15, 99); });

  const endTime = performance.now();
  const searchTime = Math.round(endTime - startTime);

  return {
    results: scored,
    totalResults: scored.length,
    searchTime,
    searchMode: mode,
    metrics: {
      query, searchMode: mode,
      engine: "MongoDB Atlas",
      totalResults: scored.length,
      searchTime,
      database: "justicesearch", collection: "judgments",
      indexUsed: "$regex (text match)",
      pipelineStages: ["$match ($regex)", "$project (-embedding)", "$limit 50", "client-side scoring"],
    },
  };
}
