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

  // ── Build $search stage using judgment_search Atlas Search index ──
  const searchTextFields = [
    { path: "caseTitle", score: { boost: { value: 5 } } },
    { path: "headnotes", score: { boost: { value: 4 } } },
    { path: "tags", score: { boost: { value: 3 } } },
    { path: "acts", score: { boost: { value: 2 } } },
    { path: "fullText", score: { boost: { value: 1 } } },
  ];

  // Keyword mode: fuzzy matching (tolerates typos)
  // Semantic mode: synonym-aware text search (uses legal_synonyms mapping)
  const shouldClauses = [];

  // Fuzzy text clause (handles typos like "hormocide" → "homicide")
  shouldClauses.push({
    text: {
      query,
      path: searchTextFields.map(f => f.path),
      fuzzy: { maxEdits: 2, prefixLength: 2 },
      score: { boost: { value: mode === "keyword" ? 3 : 1 } },
    },
  });

  // Synonym-aware clause (uses legal_synonyms collection)
  if (mode === "semantic") {
    shouldClauses.push({
      text: {
        query,
        path: searchTextFields.map(f => f.path),
        synonyms: "legal_synonyms",
        score: { boost: { value: 4 } },
      },
    });
  }

  // Exact phrase boost
  shouldClauses.push({
    phrase: {
      query,
      path: ["caseTitle", "headnotes"],
      score: { boost: { value: 10 } },
    },
  });

  // ── $search stage (text relevance only — no filter here) ──
  // courtLevel, category, disposition are stringFacet in the index,
  // so we cannot use the text operator on them inside $search.
  // We apply those filters as a $match stage AFTER $search.

  // Only year range can go inside $search (it's indexed as number).
  const filterClauses: Record<string, unknown>[] = [];
  if (filters.yearRange) {
    filterClauses.push({
      range: { path: "year", gte: filters.yearRange[0], lte: filters.yearRange[1] },
    });
  }

  const searchStage: Record<string, unknown> = {
    $search: {
      index: "judgment_search",
      compound: {
        should: shouldClauses,
        minimumShouldMatch: 1,
        ...(filterClauses.length > 0 ? { filter: filterClauses } : {}),
      },
    },
  };

  // ── Post-search $match for stringFacet fields ──
  const postMatchFilter: Record<string, unknown> = {};
  if (filters.courtLevel?.length) {
    postMatchFilter.courtLevel = { $in: filters.courtLevel };
  }
  if (filters.disposition?.length) {
    postMatchFilter.disposition = { $in: filters.disposition };
  }
  if (filters.category?.length) {
    // Sidebar sends broad categories like "Criminal", "Constitutional"
    // but DB has "Criminal - Bail", "Constitutional - Fundamental Rights" etc.
    // Use regex to match the prefix.
    const catRegex = filters.category.map(c => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    postMatchFilter.category = { $regex: `^(${catRegex})`, $options: "i" };
  }

  const pipeline: Record<string, unknown>[] = [
    searchStage,
    // Apply post-search filters if any
    ...(Object.keys(postMatchFilter).length > 0 ? [{ $match: postMatchFilter }] : []),
    {
      $addFields: {
        searchScore: { $meta: "searchScore" },
        matchScore: {
          $min: [{ $round: [{ $multiply: [{ $meta: "searchScore" }, 10] }, 0] }, 99],
        },
      },
    },
    { $project: { embedding: 0 } },
    { $limit: 50 },
  ];

  const results = await collection.aggregate(pipeline).toArray();

  // Map _id for client
  const mapped = results.map((doc) => ({
    ...doc,
    _id: doc.sourceId || doc._id?.toString(),
  }));

  const endTime = performance.now();
  const searchTime = Math.round(endTime - startTime);

  // Build pipeline description for metrics
  const activeFilters = [
    ...(filters.courtLevel?.length ? [`courtLevel: ${filters.courtLevel.join(", ")}`] : []),
    ...(filters.disposition?.length ? [`disposition: ${filters.disposition.join(", ")}`] : []),
    ...(filters.category?.length ? [`category: ${filters.category.join(", ")}`] : []),
    ...(filters.yearRange ? [`year: ${filters.yearRange[0]}–${filters.yearRange[1]}`] : []),
  ];
  const pipelineDesc = [
    `$search (index: judgment_search, compound)`,
    `  should: fuzzy (maxEdits:2)${mode === "semantic" ? " + synonyms (legal_synonyms)" : ""}`,
    `  should: phrase boost (caseTitle, headnotes)`,
    ...(filterClauses.length > 0 ? [`  filter: year range`] : []),
    ...(Object.keys(postMatchFilter).length > 0 ? [`$match (${activeFilters.join(", ")})`] : []),
    `$addFields (searchScore, matchScore)`,
    `$project (-embedding)`,
    `$limit 50`,
  ];

  return {
    results: mapped,
    totalResults: mapped.length,
    searchTime,
    searchMode: mode,
    metrics: {
      query,
      searchMode: mode,
      engine: mode === "semantic" ? "Atlas Search + Synonyms" : "Atlas Search + Fuzzy",
      totalResults: mapped.length,
      searchTime,
      database: "justicesearch",
      collection: "judgments",
      indexUsed: "judgment_search",
      pipelineStages: pipelineDesc,
    },
  };
}
