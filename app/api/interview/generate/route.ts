import { NextRequest, NextResponse } from "next/server";
import { generateCompletion, parseJSON } from "@/lib/openai";
import { generateId } from "@/lib/utils";
import {
  InterviewGenerateRequest,
  InterviewPlan,
  InterviewQuestion,
  ScorecardItem,
} from "@/types";

interface GeneratedPlan {
  questions: Array<{
    category: "technical" | "behavioral" | "culture";
    question: string;
    goodSigns: string[];
    redFlags: string[];
  }>;
  scorecard: Array<{
    label: string;
    description: string;
    maxScore: number;
  }>;
  interviewerNotesHint: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: InterviewGenerateRequest = await request.json();

    if (!body.roleProfile) {
      return NextResponse.json(
        { error: "Role profile is required" },
        { status: 400 }
      );
    }

    const language = body.language || "en";
    const languageInstruction =
      language === "ja"
        ? "全ての出力は自然な日本語（人事担当者向けのビジネス日本語）で生成してください。質問、良い回答の特徴、注意点、スコアカード、面接官へのメモ、全て日本語で記載してください。"
        : "Generate all output in natural business English. All questions, good signs, red flags, scorecard items, and interviewer notes must be in English.";

    const roleContext = `
Role: ${body.roleProfile.title || "Not specified"}
Level: ${body.roleProfile.level || "unspecified"}
Required Skills: ${body.roleProfile.requiredSkills.join(", ")}
Nice-to-have Skills: ${body.roleProfile.niceToHaveSkills.join(", ")}
Responsibilities: ${body.roleProfile.responsibilities.join("; ")}
Evaluation Criteria: ${body.roleProfile.evaluationCriteria.join("; ")}
`;

    const candidateContext = body.candidateProfile
      ? `
Candidate Information:
- Skills: ${body.candidateProfile.keySkills.join(", ")}
- Background: ${body.candidateProfile.experienceSummary}
`
      : "";

    const systemPrompt = `You are a senior hiring manager creating a comprehensive interview plan. ${languageInstruction}

Guidelines for questions:
- Avoid generic questions like "Tell me about yourself" or "What are your strengths/weaknesses"
- Focus on practical experience, decision-making, problem-solving, teamwork, and culture fit
- Make questions specific to the role requirements
- ${body.candidateProfile ? "Tailor some questions to the candidate's background" : "Keep questions general but role-specific"}
- Never comment on mental health, protected attributes, or illegal interview topics
- Include 3-4 questions per category (technical, behavioral, culture)

Guidelines for goodSigns and redFlags:
- Provide 2-3 specific indicators for each
- Be concrete and observable
- Focus on behaviors and responses, not personality judgments

Guidelines for scorecard:
- Include 5-7 evaluation categories
- Categories should cover: Communication, Technical Fit, Problem Solving, Ownership/Initiative, Teamwork, Culture Fit, Overall Recommendation
- Max scores should be 5 for each category
- Descriptions should be clear and specific

You must respond with valid JSON matching this structure:
{
  "questions": [
    {
      "category": "technical" | "behavioral" | "culture",
      "question": "string",
      "goodSigns": ["string array"],
      "redFlags": ["string array"]
    }
  ],
  "scorecard": [
    {
      "label": "string",
      "description": "string",
      "maxScore": 5
    }
  ],
  "interviewerNotesHint": "string - 2-4 sentences of guidance for the interviewer"
}`;

    const userPrompt = `Create a comprehensive interview plan for the following role:

${roleContext}
${candidateContext}

Generate:
1. 9-12 interview questions (3-4 per category: technical, behavioral, culture)
2. For each question, provide good signs and red flags
3. A scorecard with 5-7 evaluation categories
4. A brief interviewer guidance note`;

    const response = await generateCompletion(systemPrompt, userPrompt, 0.7);
    const parsed = parseJSON<GeneratedPlan>(response);

    const questions: InterviewQuestion[] = parsed.questions.map((q) => ({
      id: generateId(),
      category: q.category,
      question: q.question,
      goodSigns: q.goodSigns,
      redFlags: q.redFlags,
    }));

    const scorecard: ScorecardItem[] = parsed.scorecard.map((s) => ({
      id: generateId(),
      label: s.label,
      description: s.description,
      maxScore: s.maxScore,
    }));

    const interviewPlan: InterviewPlan = {
      id: generateId(),
      roleProfile: body.roleProfile,
      candidateProfile: body.candidateProfile,
      questions,
      scorecard,
      interviewerNotesHint: parsed.interviewerNotesHint,
      language,
    };

    return NextResponse.json({ interviewPlan });
  } catch (error) {
    console.error("Interview generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate interview plan" },
      { status: 500 }
    );
  }
}














