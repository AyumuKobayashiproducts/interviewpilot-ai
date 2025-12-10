import { NextRequest, NextResponse } from "next/server";
import { generateCompletion, parseJSON } from "@/lib/openai";
import { generateId } from "@/lib/utils";
import { CandidateAnalyzeRequest, CandidateProfile } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: CandidateAnalyzeRequest = await request.json();

    if (!body.candidateText || body.candidateText.trim().length === 0) {
      return NextResponse.json(
        { error: "Candidate text is required" },
        { status: 400 }
      );
    }

    const language = body.language || "en";
    const languageInstruction =
      language === "ja"
        ? "全ての出力は自然な日本語（人事担当者向けのビジネス日本語）で生成してください。"
        : "Generate all output in natural business English.";

    const systemPrompt = `You are an expert technical recruiter and HR professional. Your task is to analyze candidate resumes or summaries and extract key information.

${languageInstruction}

Guidelines:
- Extract only information that is clearly stated in the text
- Do not fabricate companies, role titles, or experiences
- Be accurate and honest in your summary
- Focus on skills, experiences, and achievements that are relevant for hiring decisions

You must respond with valid JSON matching this exact structure:
{
  "name": "string or null",
  "headline": "string or null",
  "keySkills": ["string array - top 8-10 skills"],
  "experienceSummary": "string - 2-3 sentence summary of their background"
}`;

    const userPrompt = `Please analyze the following candidate information and extract structured data:

---
${body.candidateText}
---

Extract:
1. Name (if mentioned)
2. Professional headline or title (if clear)
3. Key skills (technical and soft skills, up to 10)
4. Experience summary (a concise 2-3 sentence summary of their professional background)`;

    const response = await generateCompletion(systemPrompt, userPrompt, 0.3);
    const parsed = parseJSON<Omit<CandidateProfile, "id" | "rawText">>(response);

    const candidateProfile: CandidateProfile = {
      id: generateId(),
      name: parsed.name || undefined,
      headline: parsed.headline || undefined,
      keySkills: parsed.keySkills || [],
      experienceSummary: parsed.experienceSummary || "",
      rawText: body.candidateText,
    };

    return NextResponse.json({ candidateProfile });
  } catch (error) {
    console.error("Candidate analyze error:", error);
    return NextResponse.json(
      { error: "Failed to analyze candidate information" },
      { status: 500 }
    );
  }
}



