import { NextResponse } from "next/server";
import { connectToDatabase, isMongoConfigured } from "@/lib/mongodb";
import {
  generateEmbeddingsBatch,
  isVoyageConfigured,
  getEmbeddingDimensions,
  getModelName,
} from "@/lib/embeddings";
import { sampleJudgments } from "@/data/judgments";

/**
 * GET /api/seed
 *
 * Seeds MongoDB with 1012 judgment documents + Voyage AI legal embeddings.
 * Uses voyage-law-2 for domain-specific legal vector search.
 * Handles batched inserts (500 at a time) for large datasets.
 *
 * Call this ONCE to populate your database, then create indexes in Atlas UI.
 */
export async function GET() {
  // ── Pre-flight checks ──
  if (!isMongoConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: "MongoDB not configured",
        fix: "Set MONGODB_URI in .env.local with your Atlas connection string",
      },
      { status: 400 }
    );
  }

  const useEmbeddings = isVoyageConfigured();
  const dimensions = getEmbeddingDimensions();
  const model = getModelName();

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("judgments");

    // ── Clear existing ──
    await collection.deleteMany({});
    console.log("✓ Cleared existing judgments");

    console.log(`📦 Preparing ${sampleJudgments.length} judgments for seeding...`);

    // ── Prepare texts for batch embedding ──
    const textsToEmbed = sampleJudgments.map((j) =>
      [j.caseTitle, j.headnotes, j.fullText, j.category, ...j.tags].join(" ")
    );

    // ── Generate embeddings in batch (much faster than one-by-one) ──
    let embeddings: number[][] | null = null;
    if (useEmbeddings) {
      console.log(
        `⏳ Generating embeddings for ${textsToEmbed.length} judgments using ${model}...`
      );
      try {
        embeddings = await generateEmbeddingsBatch(textsToEmbed, "document");
        console.log(
          `✅ Generated ${embeddings.length} embeddings (${dimensions} dims each)`
        );
      } catch (err) {
        console.error("❌ Embedding generation failed:", err);
      }
    }

    // ── Build documents ──
    const documents = sampleJudgments.map((judgment, i) => {
      const doc: Record<string, unknown> = {
        ...judgment,
        _id: undefined,
        sourceId: judgment._id,
        indexedAt: new Date(),
        embeddingModel: useEmbeddings && embeddings ? model : null,
      };
      delete doc._id;

      if (embeddings && embeddings[i]) {
        doc.embedding = embeddings[i];
      }

      return doc;
    });

    // ── Batched insert (500 docs at a time to avoid 16MB BSON limit) ──
    const BATCH_SIZE = 500;
    let totalInserted = 0;
    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = documents.slice(i, i + BATCH_SIZE);
      const result = await collection.insertMany(batch);
      totalInserted += result.insertedCount;
      console.log(`✓ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${result.insertedCount} docs (total: ${totalInserted})`);
    }
    console.log(`✓ Inserted ${totalInserted} judgments total`);

    // ── Seed synonyms collection (expanded for 20 categories) ──
    const synonymsColl = db.collection("legal_synonyms");
    await synonymsColl.deleteMany({});
    await synonymsColl.insertMany([
      { mappingType: "equivalent", synonyms: ["divorce", "matrimonial dispute", "marriage dissolution", "separation"] },
      { mappingType: "equivalent", synonyms: ["murder", "homicide", "culpable homicide", "killing"] },
      { mappingType: "equivalent", synonyms: ["bail", "anticipatory bail", "regular bail", "default bail"] },
      { mappingType: "equivalent", synonyms: ["privacy", "right to privacy", "data protection", "digital surveillance"] },
      { mappingType: "equivalent", synonyms: ["environment", "pollution", "ecological", "green tribunal", "deforestation"] },
      { mappingType: "equivalent", synonyms: ["tax", "income tax", "taxation", "revenue", "GST"] },
      { mappingType: "equivalent", synonyms: ["labour", "employment", "industrial dispute", "retrenchment", "wages"] },
      { mappingType: "equivalent", synonyms: ["cyber crime", "hacking", "data theft", "online fraud", "phishing"] },
      { mappingType: "equivalent", synonyms: ["corruption", "bribery", "disproportionate assets", "money laundering"] },
      { mappingType: "equivalent", synonyms: ["insolvency", "bankruptcy", "IBC", "CIRP", "liquidation"] },
      { mappingType: "equivalent", synonyms: ["consumer", "deficiency of service", "unfair trade practice", "product liability"] },
      { mappingType: "equivalent", synonyms: ["reservation", "affirmative action", "OBC", "SC/ST", "quota"] },
      { mappingType: "equivalent", synonyms: ["rape", "sexual assault", "POCSO", "sexual offence"] },
      { mappingType: "equivalent", synonyms: ["contract", "breach of contract", "specific performance", "damages"] },
      { mappingType: "equivalent", synonyms: ["election", "election petition", "disqualification", "corrupt practices"] },
      { mappingType: "equivalent", synonyms: ["custody", "child custody", "guardianship", "visitation rights"] },
      { mappingType: "equivalent", synonyms: ["copyright", "trademark", "patent", "intellectual property"] },
      { mappingType: "equivalent", synonyms: ["arbitration", "arbitral award", "Section 34", "commercial dispute"] },
      { mappingType: "equivalent", synonyms: ["property", "land dispute", "title", "possession", "partition"] },
      { mappingType: "equivalent", synonyms: ["cheque bounce", "dishonour", "Section 138", "negotiable instrument"] },
    ]);
    console.log("✓ Seeded 20 synonym mappings");

    // ── Index definitions (user must create these in Atlas UI) ──
    const atlasSearchIndex = {
      name: "judgment_search",
      definition: {
        mappings: {
          dynamic: false,
          fields: {
            caseTitle: { type: "string", analyzer: "lucene.standard" },
            headnotes: { type: "string", analyzer: "lucene.standard" },
            fullText: { type: "string", analyzer: "lucene.standard" },
            category: { type: "stringFacet" },
            courtLevel: { type: "stringFacet" },
            disposition: { type: "stringFacet" },
            year: { type: "number" },
            acts: { type: "string", analyzer: "lucene.standard" },
            tags: { type: "string", analyzer: "lucene.standard" },
            bench: { type: "string", analyzer: "lucene.standard" },
            state: { type: "stringFacet" },
          },
        },
        synonyms: [
          {
            name: "legal_synonyms",
            analyzer: "lucene.standard",
            source: { collection: "legal_synonyms" },
          },
        ],
      },
    };

    const vectorSearchIndex = {
      name: "judgment_vector_index",
      type: "vectorSearch",
      definition: {
        fields: [
          {
            type: "vector",
            path: "embedding",
            numDimensions: dimensions, // 1024 for voyage-law-2
            similarity: "cosine",
          },
        ],
      },
    };

    return NextResponse.json({
      success: true,
      message: `Seeded ${totalInserted} judgments into MongoDB Atlas`,
      database: "justicesearch",
      collections: {
        judgments: `${totalInserted} documents`,
        legal_synonyms: "20 synonym mappings",
      },
      embeddings: {
        generated: useEmbeddings && !!embeddings,
        model: model,
        dimensions: dimensions,
        provider: "Voyage AI via MongoDB Atlas (ai.mongodb.com)",
        note: "voyage-law-2 is domain-specific for LEGAL text — ideal for judicial search",
      },
      nextSteps: [
        "1. Open Compass → connect to your cluster → browse 'justicesearch' database",
        "2. In Atlas UI → Database → Search → Create Search Index → paste atlasSearchIndex JSON",
        "3. In Atlas UI → Database → Search → Create Search Index → select 'Vector Search' → paste vectorSearchIndex JSON",
        "4. Return to the app and try all 3 search modes!",
      ],
      indexDefinitions: {
        atlasSearchIndex,
        vectorSearchIndex,
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
