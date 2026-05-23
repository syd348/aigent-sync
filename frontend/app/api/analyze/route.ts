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

    // Simulate LLM processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Extremely basic mock extraction logic just to return different things
    let assignee = "Unassigned";
    let deadline = "TBD";
    let title = "Extracted Task";
    
    if (text.toLowerCase().includes("sarah")) assignee = "Sarah Miller";
    else if (text.toLowerCase().includes("alex")) assignee = "Alex Martinez";
    else if (text.toLowerCase().includes("david")) assignee = "David Wu";
    else if (text.toLowerCase().includes("security team")) assignee = "Security Team";

    if (text.toLowerCase().includes("friday")) deadline = "Friday 5:00 PM";
    else if (text.toLowerCase().includes("thursday")) deadline = "Thursday EOD";
    else if (text.toLowerCase().includes("tomorrow")) deadline = "Tomorrow 12:00 PM";

    if (text.toLowerCase().includes("roadmap")) title = "Update Q3 Roadmap Deck";
    else if (text.toLowerCase().includes("security")) title = "Review Security Protocols";
    else if (text.toLowerCase().includes("latency")) title = "Investigate Staging Latency";

    const mockResponse: AnalysisResponse = {
      title,
      assignee,
      deadline,
      confidence: Math.floor(Math.random() * (99 - 70 + 1) + 70), // Random between 70 and 99
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
