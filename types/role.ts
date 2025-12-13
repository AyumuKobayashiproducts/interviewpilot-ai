export type RoleLevel = "junior" | "mid" | "senior" | "lead" | "unspecified";

export interface RoleProfile {
  id?: string;
  title?: string;
  level?: RoleLevel;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  responsibilities: string[];
  evaluationCriteria: string[];
  // 求人票とは別に、採用側の意図（人物像/優先順位/NGなど）を保持（任意）
  hiringPreferences?: string;
  rawText: string;
}

export interface RoleAnalyzeRequest {
  jobDescription: string;
  language: "en" | "ja";
}

export interface RoleAnalyzeResponse {
  roleProfile: RoleProfile;
}

















