import { NextResponse } from "next/server";
import { AnalysisResponse } from "@/app/types";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: "Text is required for analysis." },
        { status: 400 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // Call the FastAPI /api/analyze endpoint
    const response = await fetch(`${backendUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FastAPI responded with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Map backend response (schemas.AnalyzeResponse) to frontend (AnalysisResponse)
    const frontendResponse: AnalysisResponse = {
      title: data.description || "Extracted Task",
      assignee: data.assignee || "Unassigned",
      deadline: data.deadline || "TBD",
      confidence: Math.round((data.confidence_score || 0) * 100), // 0.95 -> 95
    };

    return NextResponse.json(frontendResponse);
  } catch (error: any) {
    console.error("Error connecting to backend /api/analyze:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend: " + error.message },
      { status: 500 }
    );
  }
}

