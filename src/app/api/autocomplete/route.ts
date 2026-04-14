import { NextRequest, NextResponse } from "next/server";
import { getAutocompleteSuggestions } from "@/lib/search";
import { connectToDatabase, isMongoConfigured } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") || "";
  if (!query || query.length < 2) return NextResponse.json({ suggestions: [] });

  // Try MongoDB Atlas first
  if (isMongoConfigured()) {
    try {
      const { db } = await connectToDatabase();
      const col = db.collection("judgments");
      const regex = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const suggestions = new Set<string>();

      // From titles
      const titles = await col.find({ caseTitle: { $regex: regex, $options: "i" } }).project({ caseTitle: 1 }).limit(4).toArray();
      titles.forEach(d => suggestions.add(d.caseTitle));

      // From tags
      const tagDocs = await col.find({ tags: { $regex: regex, $options: "i" } }).project({ tags: 1 }).limit(10).toArray();
      tagDocs.forEach(d => d.tags?.forEach((t: string) => { if (t.toLowerCase().includes(query.toLowerCase())) suggestions.add(t); }));

      // From categories
      const catDocs = await col.find({ category: { $regex: regex, $options: "i" } }).project({ category: 1 }).limit(5).toArray();
      catDocs.forEach(d => suggestions.add(d.category));

      // From acts
      const actDocs = await col.find({ acts: { $regex: regex, $options: "i" } }).project({ acts: 1 }).limit(5).toArray();
      actDocs.forEach(d => d.acts?.forEach((a: string) => { if (a.toLowerCase().includes(query.toLowerCase())) suggestions.add(a); }));

      return NextResponse.json({ suggestions: [...suggestions].slice(0, 8) });
    } catch (err) {
      console.error("MongoDB autocomplete failed, fallback:", err);
    }
  }

  // Fallback: in-memory
  const suggestions = getAutocompleteSuggestions(query);
  return NextResponse.json({ suggestions });
}
