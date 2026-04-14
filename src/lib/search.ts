import { Judgment, sampleJudgments, synonymsMap, fuzzyCorrections } from "@/data/judgments";

export interface SearchFilters {
  courtLevel?: string[];
  yearRange?: [number, number];
  disposition?: string[];
  judgeName?: string;
  category?: string[];
}

export interface SearchResult {
  results: Judgment[];
  totalResults: number;
  searchTime: number;
  correctedQuery?: string;
  expandedTerms?: string[];
  searchMode: "keyword" | "semantic";
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function fuzzyMatch(query: string): string {
  const lower = query.toLowerCase();
  if (fuzzyCorrections[lower]) return fuzzyCorrections[lower];
  
  let bestMatch = query;
  let bestDistance = Infinity;
  
  const commonTerms = [
    "homicide", "murder", "divorce", "maintenance", "arbitration",
    "evidence", "constitution", "fundamental", "pollution", "environment",
    "bail", "property", "copyright", "privacy", "surveillance", "matrimonial",
    "insolvency", "bankruptcy", "corruption", "defamation", "employment",
    "retrenchment", "guardianship", "custody", "reservation", "election",
    "contract", "cyber", "consumer", "negligence", "compensation",
    "injunction", "patent", "trademark", "labour", "cheque",
    "harassment", "molestation", "rape", "fraud", "bribery",
    "liquidation", "deforestation", "wildlife", "gratuity", "wages",
    "eviction", "partition", "succession", "tenancy", "adoption",
  ];
  
  for (const term of commonTerms) {
    const distance = levenshteinDistance(lower, term);
    if (distance <= 2 && distance < bestDistance) {
      bestDistance = distance;
      bestMatch = term;
    }
  }
  
  return bestMatch;
}

function expandWithSynonyms(query: string): string[] {
  const lower = query.toLowerCase();
  const terms: string[] = [lower];
  
  for (const [key, synonyms] of Object.entries(synonymsMap)) {
    if (lower.includes(key)) {
      terms.push(...synonyms);
    }
    for (const syn of synonyms) {
      if (lower.includes(syn)) {
        terms.push(key);
        terms.push(...synonyms.filter(s => s !== syn));
      }
    }
  }
  
  return [...new Set(terms)];
}

function calculateMatchScore(judgment: Judgment, searchTerms: string[]): number {
  let score = 0;
  const searchableText = [
    judgment.caseTitle,
    judgment.headnotes,
    judgment.fullText,
    judgment.category,
    ...judgment.acts,
    ...judgment.sections,
    ...judgment.tags,
    judgment.snippet
  ].join(" ").toLowerCase();

  for (const term of searchTerms) {
    const termLower = term.toLowerCase();
    // Title match (highest weight)
    if (judgment.caseTitle.toLowerCase().includes(termLower)) score += 30;
    // Headnotes match
    if (judgment.headnotes.toLowerCase().includes(termLower)) score += 25;
    // Tags match
    if (judgment.tags.some(t => t.toLowerCase().includes(termLower))) score += 20;
    // Acts match
    if (judgment.acts.some(a => a.toLowerCase().includes(termLower))) score += 15;
    // Full text match
    const matches = (searchableText.match(new RegExp(termLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "gi")) || []).length;
    score += Math.min(matches * 5, 25);
  }

  // Normalize to 0-100
  return Math.min(Math.round(score / searchTerms.length), 99);
}

function highlightText(text: string, searchTerms: string[]): string {
  let highlighted = text;
  for (const term of searchTerms) {
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
    highlighted = highlighted.replace(regex, "**$1**");
  }
  return highlighted;
}

export function performSearch(
  query: string,
  mode: "keyword" | "semantic",
  filters: SearchFilters
): SearchResult {
  const startTime = performance.now();
  
  // Fuzzy correction
  const correctedQuery = fuzzyMatch(query);
  const wasCorreted = correctedQuery.toLowerCase() !== query.toLowerCase();
  
  // Synonym expansion
  const expandedTerms = expandWithSynonyms(correctedQuery);
  const searchTerms = correctedQuery.split(/\s+/).concat(
    expandedTerms.flatMap(t => t.split(/\s+/))
  );
  const uniqueTerms = [...new Set(searchTerms.map(t => t.toLowerCase()))];

  let results = sampleJudgments.map(judgment => {
    const score = calculateMatchScore(judgment, uniqueTerms);
    return {
      ...judgment,
      matchScore: score,
      snippet: highlightText(judgment.snippet, uniqueTerms),
    };
  });

  // Filter out zero-score results
  results = results.filter(r => (r.matchScore || 0) > 0);

  // Apply filters
  if (filters.courtLevel && filters.courtLevel.length > 0) {
    results = results.filter(r => filters.courtLevel!.includes(r.courtLevel));
  }
  if (filters.yearRange) {
    results = results.filter(r => r.year >= filters.yearRange![0] && r.year <= filters.yearRange![1]);
  }
  if (filters.disposition && filters.disposition.length > 0) {
    results = results.filter(r => filters.disposition!.includes(r.disposition));
  }
  if (filters.judgeName) {
    results = results.filter(r => 
      r.bench.some(j => j.toLowerCase().includes(filters.judgeName!.toLowerCase()))
    );
  }
  if (filters.category && filters.category.length > 0) {
    results = results.filter(r => 
      filters.category!.some(cat => r.category.toLowerCase().includes(cat.toLowerCase()))
    );
  }

  // Sort by match score
  results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  // For semantic mode, boost scores and add AI label
  if (mode === "semantic") {
    results = results.map(r => ({
      ...r,
      matchScore: Math.min((r.matchScore || 0) + 15, 99),
    }));
  }

  const endTime = performance.now();

  return {
    results,
    totalResults: results.length,
    searchTime: Math.round(endTime - startTime),
    correctedQuery: wasCorreted ? correctedQuery : undefined,
    expandedTerms: expandedTerms.length > 1 ? expandedTerms.slice(1) : undefined,
    searchMode: mode,
  };
}

export function getAutocompleteSuggestions(query: string): string[] {
  if (!query || query.length < 2) return [];
  
  const lower = query.toLowerCase();
  const suggestions = new Set<string>();
  
  // From case titles
  sampleJudgments.forEach(j => {
    if (j.caseTitle.toLowerCase().includes(lower)) {
      suggestions.add(j.caseTitle);
    }
  });
  
  // From tags
  sampleJudgments.forEach(j => {
    j.tags.forEach(tag => {
      if (tag.toLowerCase().includes(lower)) {
        suggestions.add(tag);
      }
    });
  });
  
  // From acts
  sampleJudgments.forEach(j => {
    j.acts.forEach(act => {
      if (act.toLowerCase().includes(lower)) {
        suggestions.add(act);
      }
    });
  });
  
  // From categories
  sampleJudgments.forEach(j => {
    if (j.category.toLowerCase().includes(lower)) {
      suggestions.add(j.category);
    }
  });
  
  return [...suggestions].slice(0, 8);
}
