/**
 * Voyage AI Embeddings via MongoDB Atlas
 *
 * Uses voyage-law-2 — a domain-specific model optimized for LEGAL text.
 * 1024-dimensional vectors, 16K token context window.
 *
 * API endpoint: https://ai.mongodb.com/v1/embeddings
 * Auth: Bearer token using Model API Key from Atlas UI
 *
 * Each judgment is embedded ONCE at seed time and stored alongside the doc:
 *   {
 *     _id: ObjectId("..."),
 *     caseTitle: "State v. Sharma",
 *     fullText: "...",
 *     embedding: [0.0123, -0.0456, ...]   // 1024 floats
 *   }
 */

const VOYAGE_API_KEY = (process.env.VOYAGE_API_KEY || "").trim();
const VOYAGE_MODEL = (process.env.VOYAGE_MODEL || "voyage-law-2").trim();
const VOYAGE_BASE_URL = "https://ai.mongodb.com/v1/embeddings";

// Dimensions per model
const MODEL_DIMENSIONS: Record<string, number> = {
  "voyage-law-2": 1024,
  "voyage-4": 1024,
  "voyage-4-lite": 1024,
  "voyage-4-large": 1024,
  "voyage-3-large": 1024,
};

export function getEmbeddingDimensions(): number {
  return MODEL_DIMENSIONS[VOYAGE_MODEL] || 1024;
}

export function getModelName(): string {
  return VOYAGE_MODEL;
}

/**
 * Generate a single embedding for a text string
 * @param text  — the text to embed
 * @param inputType — "document" for indexing, "query" for search queries
 */
export async function generateEmbedding(
  text: string,
  inputType: "document" | "query" = "document"
): Promise<number[]> {
  if (!isVoyageConfigured()) {
    throw new Error("VOYAGE_API_KEY not configured");
  }

  const response = await fetch(VOYAGE_BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VOYAGE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: [text.slice(0, 32000)], // voyage-law-2 supports 16K tokens
      model: VOYAGE_MODEL,
      input_type: inputType,         // "document" adds doc-optimized prompt, "query" adds query-optimized prompt
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Voyage AI API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.data[0].embedding; // float[1024]
}

/**
 * Generate embeddings for multiple texts in a single batch
 * Voyage AI supports batching for efficiency
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  inputType: "document" | "query" = "document"
): Promise<number[][]> {
  if (!isVoyageConfigured()) {
    throw new Error("VOYAGE_API_KEY not configured");
  }

  // Voyage allows up to 128 texts per batch
  const batchSize = 128;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize).map(t => t.slice(0, 32000));

    const response = await fetch(VOYAGE_BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VOYAGE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: batch,
        model: VOYAGE_MODEL,
        input_type: inputType,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Voyage AI batch error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const embeddings = data.data
      .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
      .map((item: { embedding: number[] }) => item.embedding);

    allEmbeddings.push(...embeddings);

    // Small delay between batches to respect rate limits
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return allEmbeddings;
}

export function isVoyageConfigured(): boolean {
  return !!VOYAGE_API_KEY && VOYAGE_API_KEY.length > 10;
}
