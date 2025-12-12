export interface CandidateProfile {
  id?: string;
  name?: string;
  headline?: string;
  keySkills: string[];
  experienceSummary: string;
  rawText: string;
}

export interface CandidateAnalyzeRequest {
  candidateText: string;
  language: "en" | "ja";
}

export interface CandidateAnalyzeResponse {
  candidateProfile: CandidateProfile;
}














