import { NextRequest, NextResponse } from "next/server";
import { generateCompletion, parseJSON } from "@/lib/openai";

interface CandidateSampleRequest {
  language?: "en" | "ja";
}

interface CandidateSampleResponse {
  candidateText: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CandidateSampleRequest = await request.json().catch(() => ({}));
    const language = body.language || "en";

    const languageInstruction =
      language === "ja"
        ? "全ての出力は自然な日本語（人事担当者向けのビジネス日本語）で生成してください。"
        : "Generate all output in natural business English.";

    const systemPrompt = `You are an expert technical recruiter.

${languageInstruction}

Your task is to create a realistic but fully anonymized sample candidate summary for a mid-to-senior software engineer.

Guidelines:
- Do NOT use any real company names or personally identifiable information
- Focus on a short narrative summary plus key achievements and skills
- Make it look like something a recruiter would paste as a candidate overview

You must respond with valid JSON in this exact structure:
{
  "candidateText": "multi-line candidate summary text"
}`;

    const userPrompt =
      language === "ja"
        ? "フルスタックもしくはバックエンドエンジニア候補者のサンプル要約テキストを1つだけ作成してください。"
        : "Create one sample candidate summary for a full-stack or backend engineer.";

    const response = await generateCompletion(systemPrompt, userPrompt, 0.7);
    const parsed = parseJSON<CandidateSampleResponse>(response);

    const result: CandidateSampleResponse = {
      candidateText: parsed.candidateText,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Candidate sample error:", error);
    return NextResponse.json(
      { error: "Failed to generate sample candidate" },
      { status: 500 }
    );
  }
}


