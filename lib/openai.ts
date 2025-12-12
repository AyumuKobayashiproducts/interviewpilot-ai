import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY environment variable is not set. Please add it to your .env.local file."
      );
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7,
  model: string = "gpt-4o"
): Promise<string> {
  const openai = getOpenAIClient();
  
  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  return content;
}

export function parseJSON<T>(jsonString: string): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${error}`);
  }
}

export default getOpenAIClient;
