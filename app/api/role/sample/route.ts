import { NextRequest, NextResponse } from "next/server";
import { generateCompletion, parseJSON } from "@/lib/openai";

interface RoleSampleRequest {
  language?: "en" | "ja";
}

interface RoleSampleResponse {
  jobDescription: string;
  title: string | null;
  level: "junior" | "mid" | "senior" | "lead" | "unspecified";
}

export async function POST(request: NextRequest) {
  try {
    const body: RoleSampleRequest = await request.json().catch(() => ({}));
    const language = body.language || "en";

    const languageInstruction =
      language === "ja"
        ? "全ての出力は自然な日本語（人事担当者向けのビジネス日本語）で生成してください。"
        : "Generate all output in natural business English.";

    const systemPrompt = `You are an expert HR professional and hiring manager.

${languageInstruction}

Your task is to create a realistic but fully anonymized sample job description for a modern software engineering role.

Guidelines:
- Do NOT use any real company names or personally identifiable information
- Make the description realistic for a small to mid-size tech company
- Emphasize responsibilities, required skills, and what success looks like in the first year

You must respond with valid JSON in this exact structure:
{
  "jobDescription": "multi-line job description text",
  "title": "short job title or null",
  "level": "junior" | "mid" | "senior" | "lead" | "unspecified"
}`;

    const userPrompt =
      language === "ja"
        ? "フルスタックエンジニアもしくはバックエンドエンジニアを想定したサンプル求人票を1つだけ作成してください。"
        : "Create one sample job description for a full-stack or backend software engineer role.";

    const response = await generateCompletion(systemPrompt, userPrompt, 0.7);
    const parsed = parseJSON<RoleSampleResponse>(response);

    const result: RoleSampleResponse = {
      jobDescription: parsed.jobDescription,
      title: parsed.title,
      level: parsed.level || "unspecified",
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Role sample error:", error);
    return NextResponse.json(
      { error: "Failed to generate sample job description" },
      { status: 500 }
    );
  }
}


