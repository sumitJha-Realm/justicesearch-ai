"use client";

import { useState } from "react";
import {
  Terminal, Clock, Database, Cpu, Layers, ChevronDown,
  ChevronUp, Zap, Code, Server, Brain, Search, GitBranch
} from "lucide-react";

export interface QueryMetricsData {
  // Core
  query: string;
  searchMode: "keyword" | "semantic";
  engine: string;
  totalResults: number;
  searchTime: number;

  // Atlas Search specifics
  correctedQuery?: string;
  expandedTerms?: string[];
  fuzzyDistance?: number;

  // Vector Search specifics
  embeddingModel?: string;
  embeddingDimensions?: number;
  embeddingProvider?: string;
  vectorPipeline?: string;

  // MongoDB
  database?: string;
  collection?: string;
  indexUsed?: string;
  pipelineStages?: string[];
  mongoQuery?: object;
}

interface QueryMetricsProps {
  metrics: QueryMetricsData;
}

export default function QueryMetrics({ metrics }: QueryMetricsProps) {
  const [expanded, setExpanded] = useState(true);
  const [showPipeline, setShowPipeline] = useState(false);

  const isVector = metrics.engine?.includes("Vector") || metrics.engine?.includes("REAL");
  const isSimulated = metrics.engine?.includes("SIMULATED");

  return (
    <div className="bg-[#0F172A] rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl animate-fade-in-up">
      {/* Header bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <Terminal className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-[13px] font-bold text-white">Query Inspector</span>
          <span className={`badge ${
            isSimulated
              ? "bg-amber-500/20 text-amber-400"
              : isVector
              ? "bg-violet-500/20 text-violet-400"
              : "bg-emerald-500/20 text-emerald-400"
          }`}>
            {isSimulated ? "SIMULATED" : isVector ? "ATLAS VECTOR SEARCH" : "ATLAS SEARCH"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Quick stats always visible */}
          <div className="hidden sm:flex items-center gap-4 text-[12px]">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Clock className="w-3.5 h-3.5" />
              {metrics.searchTime}ms
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <Layers className="w-3.5 h-3.5" />
              {metrics.totalResults} hits
            </span>
            {metrics.embeddingModel && (
              <span className="flex items-center gap-1.5 text-violet-400">
                <Brain className="w-3.5 h-3.5" />
                {metrics.embeddingModel}
              </span>
            )}
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-700/50">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-slate-700/50">
            <MetricCell
              icon={<Clock className="w-3.5 h-3.5" />}
              label="Response Time"
              value={`${metrics.searchTime}ms`}
              color="text-emerald-400"
            />
            <MetricCell
              icon={<Layers className="w-3.5 h-3.5" />}
              label="Results"
              value={`${metrics.totalResults}`}
              color="text-blue-400"
            />
            <MetricCell
              icon={<Search className="w-3.5 h-3.5" />}
              label="Search Mode"
              value={metrics.searchMode === "semantic" ? "Semantic" : "Keyword"}
              color="text-amber-400"
            />
            <MetricCell
              icon={<Server className="w-3.5 h-3.5" />}
              label="Engine"
              value={isVector ? "Vector Search" : isSimulated ? "Simulated" : "Atlas Search"}
              color="text-violet-400"
            />
            <MetricCell
              icon={<Brain className="w-3.5 h-3.5" />}
              label="Embedding Model"
              value={metrics.embeddingModel || "N/A"}
              color="text-pink-400"
            />
            <MetricCell
              icon={<Database className="w-3.5 h-3.5" />}
              label="Dimensions"
              value={metrics.embeddingDimensions ? `${metrics.embeddingDimensions}d` : "N/A"}
              color="text-cyan-400"
            />
          </div>

          {/* Details section */}
          <div className="px-5 py-4 space-y-3 border-t border-slate-700/50">
            {/* Query */}
            <MetricRow label="Query" value={metrics.query} />

            {/* Fuzzy correction */}
            {metrics.correctedQuery && (
              <MetricRow
                label="Fuzzy Correction"
                value={
                  <span>
                    <span className="text-red-400 line-through">{metrics.query}</span>
                    <span className="text-slate-500 mx-2">→</span>
                    <span className="text-emerald-400 font-semibold">{metrics.correctedQuery}</span>
                    <span className="text-slate-500 ml-2 text-[11px]">(Levenshtein distance ≤ 2)</span>
                  </span>
                }
              />
            )}

            {/* Synonym expansion */}
            {metrics.expandedTerms && metrics.expandedTerms.length > 0 && (
              <MetricRow
                label="Synonyms"
                value={
                  <div className="flex flex-wrap gap-1.5">
                    {metrics.expandedTerms.map((term, i) => (
                      <span key={i} className="bg-violet-500/20 text-violet-300 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                        {term}
                      </span>
                    ))}
                  </div>
                }
              />
            )}

            {/* Embedding details */}
            {metrics.embeddingModel && (
              <>
                <MetricRow label="Provider" value={metrics.embeddingProvider || "Voyage AI via MongoDB Atlas"} />
                <MetricRow label="API Endpoint" value="https://ai.mongodb.com/v1/embeddings" />
                <MetricRow
                  label="Input Type"
                  value={
                    <span>
                      <code className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-[11px]">
                        {isVector ? "query" : "document"}
                      </code>
                      <span className="text-slate-500 ml-2 text-[11px]">
                        (adds {isVector ? "search" : "indexing"}-optimized prompt)
                      </span>
                    </span>
                  }
                />
              </>
            )}

            {/* Database info */}
            <MetricRow label="Database" value={metrics.database || "justicesearch"} />
            <MetricRow label="Collection" value={metrics.collection || "judgments"} />
            <MetricRow label="Index" value={metrics.indexUsed || (isVector ? "judgment_vector_index" : "default")} />
          </div>

          {/* Pipeline toggle */}
          <div className="border-t border-slate-700/50">
            <button
              onClick={() => setShowPipeline(!showPipeline)}
              className="w-full flex items-center gap-2 px-5 py-3 text-[12px] font-semibold text-slate-400 hover:text-slate-300 hover:bg-white/[0.02] transition-colors"
            >
              <Code className="w-3.5 h-3.5" />
              {showPipeline ? "Hide" : "Show"} MongoDB Aggregation Pipeline
              {showPipeline ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
            </button>

            {showPipeline && (
              <div className="px-5 pb-4">
                <pre className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 text-[12px] text-slate-300 overflow-x-auto font-mono leading-relaxed">
                  {isVector ? vectorPipelineCode(metrics) : keywordPipelineCode(metrics)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────── */

function MetricCell({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string; color: string;
}) {
  return (
    <div className="px-4 py-3.5">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={color}>{icon}</span>
        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-[15px] font-bold ${color} truncate`}>{value}</p>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-[13px] text-slate-300 font-mono">{value}</span>
    </div>
  );
}

/* ── Pipeline code snippets ─────────────────────── */

function vectorPipelineCode(m: QueryMetricsData): string {
  return `// MongoDB Atlas Vector Search Pipeline
// Model: ${m.embeddingModel || "voyage-law-2"} (${m.embeddingDimensions || 1024} dimensions)

// Step 1: Embed user query via Voyage AI
const queryEmbedding = await fetch("https://ai.mongodb.com/v1/embeddings", {
  method: "POST",
  headers: { Authorization: "Bearer $VOYAGE_API_KEY" },
  body: JSON.stringify({
    input: ["${m.query}"],
    model: "${m.embeddingModel || "voyage-law-2"}",
    input_type: "query"          // search-optimized prompt
  })
});
// → float[${m.embeddingDimensions || 1024}]

// Step 2: Run $vectorSearch aggregation
db.judgments.aggregate([
  {
    $vectorSearch: {
      index: "judgment_vector_index",
      path: "embedding",
      queryVector: queryEmbedding,  // 1024-dim float array
      numCandidates: 50,            // ANN candidate pool
      limit: 5                      // return top 5
    }
  },
  {
    $addFields: {
      score: { $meta: "vectorSearchScore" }  // cosine similarity 0→1
    }
  },
  {
    $project: { embedding: 0 }     // exclude the vector from response
  }
]);

// Results: ${m.totalResults} documents in ${m.searchTime}ms`;
}

function keywordPipelineCode(m: QueryMetricsData): string {
  return `// MongoDB Atlas Search Pipeline
// Index: judgment_search (Lucene-based)

db.judgments.aggregate([
  {
    $search: {
      index: "judgment_search",
      compound: {
        should: [
          {
            text: {
              query: "${m.correctedQuery || m.query}",
              path: ["caseTitle", "headnotes", "fullText", "tags"],
              fuzzy: { maxEdits: 2 }     // Levenshtein distance
            }
          }${m.expandedTerms ? `,
          {
            text: {
              query: "${m.expandedTerms?.join(" ")}",
              path: ["caseTitle", "headnotes", "fullText", "tags"],
              synonyms: "legal_synonyms"  // synonym mapping collection
            }
          }` : ""}
        ]
      },
      highlight: {
        path: ["snippet", "headnotes"]
      }
    }
  },
  {
    $addFields: {
      score: { $meta: "searchScore" },
      highlights: { $meta: "searchHighlights" }
    }
  },
  {
    $facet: {
      results: [{ $limit: 20 }],
      counts: [
        { $group: { _id: "$disposition", count: { $sum: 1 } } }
      ]
    }
  }
]);

// Results: ${m.totalResults} documents in ${m.searchTime}ms`;
}
