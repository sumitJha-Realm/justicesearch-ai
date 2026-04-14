import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "";
const MONGODB_DB = process.env.MONGODB_DB || "justicesearch";

if (!MONGODB_URI) {
  console.warn(
    "⚠️  MONGODB_URI not set. Using demo mode with mock data."
  );
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{
  client: MongoClient;
  db: Db;
}> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export function isMongoConfigured(): boolean {
  return (
    !!MONGODB_URI &&
    !MONGODB_URI.includes("<username>") &&
    !MONGODB_URI.includes("<password>")
  );
}
