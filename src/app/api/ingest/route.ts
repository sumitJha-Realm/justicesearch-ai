import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, isMongoConfigured } from "@/lib/mongodb";
import { generateEmbedding, isVoyageConfigured } from "@/lib/embeddings";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { judgment } = body;

  if (!judgment) {
    return NextResponse.json({ success: false, error: "No judgment data provided" }, { status: 400 });
  }

  if (!isMongoConfigured()) {
    return NextResponse.json({ success: false, error: "MongoDB not configured" }, { status: 400 });
  }

  const startTime = Date.now();

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("judgments");

    // Step 1: Build the document
    const doc = {
      sourceId: judgment._id,
      caseNumber: judgment.caseNumber,
      caseTitle: judgment.caseTitle,
      court: judgment.court,
      courtLevel: judgment.courtLevel,
      bench: judgment.bench,
      dateOfJudgment: judgment.dateOfJudgment,
      year: judgment.year,
      disposition: judgment.disposition,
      category: judgment.category,
      acts: judgment.acts,
      sections: judgment.sections,
      headnotes: judgment.headnotes,
      fullText: judgment.fullText,
      snippet: judgment.snippet,
      citedBy: judgment.citedBy || [],
      citesTo: judgment.citesTo || [],
      district: judgment.district,
      state: judgment.state,
      petitioner: judgment.petitioner,
      respondent: judgment.respondent,
      tags: judgment.tags,
      indexedAt: new Date(),
      ingestedVia: "PDF Ingestion Demo",
    };

    const steps: { step: string; time: number; detail: string }[] = [];

    // Step 2: Generate embedding via Voyage AI
    let embedding: number[] | null = null;
    if (isVoyageConfigured()) {
      const embStart = Date.now();
      const textForEmbedding = [
        doc.caseTitle, doc.headnotes, doc.fullText, doc.category, ...doc.tags,
      ].join(" ");
      embedding = await generateEmbedding(textForEmbedding, "document");
      steps.push({
        step: "Voyage AI Embedding",
        time: Date.now() - embStart,
        detail: `Generated ${embedding.length}-dim vector via voyage-law-2`,
      });
    }

    // Step 3: Insert into MongoDB
    const insertStart = Date.now();
    const result = await collection.insertOne({
      ...doc,
      ...(embedding ? { embedding, embeddingModel: "voyage-law-2" } : {}),
    });
    steps.push({
      step: "MongoDB Insert",
      time: Date.now() - insertStart,
      detail: `Inserted as ${result.insertedId}`,
    });

    // Step 4: Verify it's searchable
    const verifyStart = Date.now();
    const count = await collection.countDocuments();
    steps.push({
      step: "Verify",
      time: Date.now() - verifyStart,
      detail: `Collection now has ${count} documents`,
    });

    return NextResponse.json({
      success: true,
      totalTime: Date.now() - startTime,
      documentId: result.insertedId,
      totalDocuments: count,
      hasEmbedding: !!embedding,
      embeddingDimensions: embedding?.length || 0,
      steps,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: String(err),
      totalTime: Date.now() - startTime,
    }, { status: 500 });
  }
}
