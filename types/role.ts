export type RoleLevel = "junior" | "mid" | "senior" | "lead" | "unspecified";

export interface RoleProfile {
  id?: string;
  title?: string;
  level?: RoleLevel;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  responsibilities: string[];
  evaluationCriteria: string[];
  rawText: string;
}

export interface RoleAnalyzeRequest {
  jobDescription: string;
  language: "en" | "ja";
}

export interface RoleAnalyzeResponse {
  roleProfile: RoleProfile;
}














