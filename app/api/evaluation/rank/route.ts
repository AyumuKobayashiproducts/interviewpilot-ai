import { NextRequest, NextResponse } from "next/server";
import { generateCompletion, parseJSON } from "@/lib/openai";

type InputEvaluation = {
  id: string;
  created_at: string;
  language?: "en" | "ja";
  role_title: string | null;
  candidate_name: string | null;
  decision: string | null;
  total_score: number | null;
};

type AiRanking = {
  id: string;
  rank: number;
  reason: string;
};

type AiRankingResponse = {
  rankings: AiRanking[];
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const language: "en" | "ja" =
      body.language === "en" || body.language === "ja" ? body.language : "ja";
    const evaluations: InputEvaluation[] = Array.isArray(body.evaluations)
      ? body.evaluations
      : [];

    if (!evaluations.length) {
      return NextResponse.json<AiRankingResponse>({ rankings: [] });
    }

    const systemPrompt =
      language === "ja"
        ? [
            "あなたはシード〜シリーズCのSaaSスタートアップで働く採用マネージャー向けのアシスタントです。",
            "与えられた候補者一覧を「どの候補者から優先的にオファーすべきか」という観点で順位付けしてください。",
            "入力として渡される各候補者オブジェクトには、id, candidate_name, role_title, decision, total_score, created_at が含まれています。",
            "total_score が高いこと、decision が Strong Yes > Yes > Maybe > No の順で好ましいことを基本ルールとしてください。",
            "ただし、スコアが近い場合には、Strong Yes を優先するなど、採用判断として自然な理由付けを行ってください。",
            "出力は必ず JSON オブジェクトで、フォーマットは次の通りにしてください:",
            '{\"rankings\":[{\"id\":\"...\",\"rank\":1,\"reason\":\"...\"}]}',
            "reason は 1 文の短いビジネスライクな日本語で、事実ベースかつ数字を含めて説明してください。",
            "トーンは Stripe の管理画面ドキュメントのように、丁寧だがフラットで簡潔にしてください（例:「Strong Yes かつスコア 82 で、要求スキルと経験年数がロール要件とよく一致しているため。」）。",
            "感嘆符やカジュアルな表現（「すばらしい」「最高です」など）は避けてください。",
          ].join("\n")
        : [
            "You are an assistant for hiring managers at seed–Series C SaaS startups.",
            "Rank the given candidates by who the team should prioritize for an offer.",
            "Each candidate object includes: id, candidate_name, role_title, decision, total_score, created_at.",
            "Use higher total_score as the main signal, and prefer decisions in this order: Strong Yes > Yes > Maybe > No.",
            "When scores are close, prefer Strong Yes over others and explain this briefly.",
            "Always respond as a JSON object with the following shape:",
            '{\"rankings\":[{\"id\":\"...\",\"rank\":1,\"reason\":\"...\"}]}',
            "reason must be a single short sentence in concise business English, grounded in facts and numbers.",
            "Use a Stripe Dashboard style tone: neutral, precise, and informative (e.g. \"Strong Yes with a score of 82 and experience closely matching the role requirements.\").",
            "Avoid exclamation marks or overly casual phrases (no \"awesome\", \"great fit!\", etc.).",
          ].join("\n");

    const userPrompt = JSON.stringify({
      candidates: evaluations,
    });

    const raw = await generateCompletion(systemPrompt, userPrompt, 0);
    const parsed = parseJSON<AiRankingResponse>(raw);

    const rankings = Array.isArray(parsed.rankings) ? parsed.rankings : [];

    return NextResponse.json<AiRankingResponse>({ rankings });
  } catch (error) {
    console.error("AI ranking error:", error);
    return NextResponse.json<AiRankingResponse>(
      { rankings: [] },
      { status: 500 }
    );
  }
}


