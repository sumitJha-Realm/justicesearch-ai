import { MongoClient } from "mongodb";
import { config } from "dotenv";
config({ path: ".env.local" });

const URI = process.env.MONGODB_URI;
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
if (!URI || !VOYAGE_API_KEY) { console.error("Set MONGODB_URI and VOYAGE_API_KEY in .env.local"); process.exit(1); }
const VOYAGE_MODEL = "voyage-law-2";
const VOYAGE_URL = "https://ai.mongodb.com/v1/embeddings";
const BATCH_SIZE = 128; // Voyage max per request

async function getEmbeddings(texts) {
  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${VOYAGE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ input: texts.map(t => t.slice(0, 32000)), model: VOYAGE_MODEL, input_type: "document" }),
  });
  if (!res.ok) throw new Error(`Voyage API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.data.sort((a, b) => a.index - b.index).map(d => d.embedding);
}

async function run() {
  const client = new MongoClient(URI);
  await client.connect();
  const col = client.db("justicesearch").collection("judgments");

  const docs = await col.find({ embedding: { $exists: false } }).toArray();
  console.log(`📦 ${docs.length} docs need embeddings\n`);

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);
    const texts = batch.map(d => [d.caseTitle, d.headnotes, d.fullText, d.category, ...(d.tags || [])].join(" "));

    console.log(`⏳ Batch ${Math.floor(i/BATCH_SIZE)+1}/${Math.ceil(docs.length/BATCH_SIZE)} (${batch.length} docs)...`);
    const embeddings = await getEmbeddings(texts);

    const bulkOps = batch.map((doc, j) => ({
      updateOne: { filter: { _id: doc._id }, update: { $set: { embedding: embeddings[j], embeddingModel: VOYAGE_MODEL } } }
    }));
    await col.bulkWrite(bulkOps);
    console.log(`   ✅ Updated ${batch.length} docs with embeddings (${embeddings[0].length} dims)`);

    if (i + BATCH_SIZE < docs.length) await new Promise(r => setTimeout(r, 300));
  }

  const withEmb = await col.countDocuments({ embedding: { $exists: true } });
  console.log(`\n🎉 Done! ${withEmb} / ${await col.countDocuments()} docs now have embeddings`);
  await client.close();
}
run();
