import { NextRequest, NextResponse } from "next/server";
import { generateCompletion, parseJSON } from "@/lib/openai";
import { generateId } from "@/lib/utils";
import { RoleAnalyzeRequest, RoleProfile } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: RoleAnalyzeRequest = await request.json();

    if (!body.jobDescription || body.jobDescription.trim().length === 0) {
      return NextResponse.json(
        { error: "Job description is required" },
        { status: 400 }
      );
    }

    const language = body.language || "en";
    const languageInstruction =
      language === "ja"
        ? "全ての出力は自然な日本語（人事担当者向けのビジネス日本語）で生成してください。"
        : "Generate all output in natural business English.";

    const systemPrompt = `You are an expert HR professional and hiring manager. Your task is to analyze job descriptions and extract structured information.

${languageInstruction}

Guidelines:
- Extract only information that is clearly stated or reasonably inferred from the job description
- Do not invent technologies, skills, or requirements that are not plausible from the text
- Be precise and professional in your summaries
- evaluationCriteria should be specific metrics or qualities to assess candidates on

You must respond with valid JSON matching this exact structure:
{
  "title": "string or null",
  "level": "junior" | "mid" | "senior" | "lead" | "unspecified",
  "requiredSkills": ["string array"],
  "niceToHaveSkills": ["string array"],
  "responsibilities": ["string array"],
  "evaluationCriteria": ["string array"]
}`;

    const userPrompt = `Please analyze the following job description and extract structured information:

---
${body.jobDescription}
---

Extract:
1. Job title (if mentioned)
2. Experience level (junior/mid/senior/lead or unspecified)
3. Required skills (technical and soft skills that are mandatory)
4. Nice-to-have skills (optional or preferred skills)
5. Key responsibilities (main duties and tasks)
6. Evaluation criteria (what qualities/skills should be evaluated in candidates)`;

    const response = await generateCompletion(systemPrompt, userPrompt, 0.3);
    const parsed = parseJSON<Omit<RoleProfile, "id" | "rawText">>(response);

    const roleProfile: RoleProfile = {
      id: generateId(),
      title: parsed.title || undefined,
      level: parsed.level || "unspecified",
      requiredSkills: parsed.requiredSkills || [],
      niceToHaveSkills: parsed.niceToHaveSkills || [],
      responsibilities: parsed.responsibilities || [],
      evaluationCriteria: parsed.evaluationCriteria || [],
      rawText: body.jobDescription,
    };

    return NextResponse.json({ roleProfile });
  } catch (error) {
    console.error("Role analyze error:", error);
    return NextResponse.json(
      { error: "Failed to analyze job description" },
      { status: 500 }
    );
  }
}











