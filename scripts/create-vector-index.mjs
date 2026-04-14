import { MongoClient } from "mongodb";
import { config } from "dotenv";
config({ path: ".env.local" });

const URI = process.env.MONGODB_URI;
if (!URI) { console.error("Set MONGODB_URI in .env.local"); process.exit(1); }

async function run() {
  const client = new MongoClient(URI);
  await client.connect();
  const db = client.db("justicesearch");
  const col = db.collection("judgments");

  // Check current doc count
  const count = await col.countDocuments();
  console.log(`📊 Documents in collection: ${count}`);

  // Check if embedding field exists
  const withEmb = await col.countDocuments({ embedding: { $exists: true } });
  console.log(`🧠 Documents with embeddings: ${withEmb}`);
  console.log(`📄 Documents without embeddings: ${count - withEmb}`);

  // Try to create vector search index
  try {
    const indexes = await col.listSearchIndexes().toArray();
    console.log(`\n📋 Existing search indexes: ${indexes.length}`);
    indexes.forEach(idx => console.log(`   - ${idx.name} (${idx.type || 'search'})`));

    // Create vector search index if not exists
    const hasVector = indexes.some(i => i.name === "judgment_vector_index");
    if (!hasVector) {
      console.log("\n⏳ Creating vector search index...");
      await col.createSearchIndex({
        name: "judgment_vector_index",
        type: "vectorSearch",
        definition: {
          fields: [{
            type: "vector",
            path: "embedding",
            numDimensions: 1024,
            similarity: "cosine"
          }]
        }
      });
      console.log("✅ Vector search index created!");
    } else {
      console.log("✅ Vector search index already exists");
    }

    // Create text search index if not exists  
    const hasSearch = indexes.some(i => i.name === "judgment_search");
    if (!hasSearch) {
      console.log("\n⏳ Creating Atlas Search index...");
      await col.createSearchIndex({
        name: "judgment_search",
        type: "search",
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
            }
          },
          synonyms: [{
            name: "legal_synonyms",
            analyzer: "lucene.standard",
            source: { collection: "legal_synonyms" }
          }]
        }
      });
      console.log("✅ Atlas Search index created!");
    } else {
      console.log("✅ Atlas Search index already exists");
    }

  } catch (err) {
    console.log("⚠️  Index creation error:", err.message);
    console.log("\n💡 If you get a permissions error, create indexes manually in Atlas UI:");
    console.log("   1. Go to Atlas → Database → Search → Create Search Index");
    console.log("   2. Vector Search index name: judgment_vector_index");
    console.log("      Path: embedding, Dimensions: 1024, Similarity: cosine");
    console.log("   3. Search index name: judgment_search (use dynamic mapping)");
  }

  await client.close();
}
run();
