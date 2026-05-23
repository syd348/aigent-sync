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

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
    
    const backendRes = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!backendRes.ok) {
      const errorText = await backendRes.text();
      throw new Error(`Backend error: ${errorText}`);
    }

    const data = await backendRes.json();

    // Map Backend AnalyzeResponse to Frontend AnalysisResponse
    const mappedResponse: AnalysisResponse = {
      title: data.description || "Untitled Task",
      assignee: data.assignee || "Unassigned",
      deadline: data.deadline || "TBD",
      confidence: Math.round((data.confidence_score || 0) * 100),
    };

    return NextResponse.json(mappedResponse);
  } catch (error: any) {
    console.error("Analysis Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
