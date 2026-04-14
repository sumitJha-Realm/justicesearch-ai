import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, isMongoConfigured } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "No ID provided" }, { status: 400 });
  }

  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "MongoDB not configured" }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("judgments");

    // Try both sourceId and _id
    let doc = await collection.findOne(
      { sourceId: id },
      { projection: { embedding: 0 } }
    );
    if (!doc) {
      try {
        doc = await collection.findOne(
          { _id: new ObjectId(id) },
          { projection: { embedding: 0 } }
        );
      } catch {
        // invalid ObjectId format, ignore
      }
    }

    if (!doc) {
      return NextResponse.json({ error: "Judgment not found" }, { status: 404 });
    }

    return NextResponse.json({ judgment: doc });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
