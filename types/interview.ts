import { RoleProfile } from "./role";
import { CandidateProfile } from "./candidate";

export type QuestionCategory = "technical" | "behavioral" | "culture";

export interface InterviewQuestion {
  id: string;
  category: QuestionCategory;
  question: string;
  goodSigns: string[];
  redFlags: string[];
}

export interface ScorecardItem {
  id: string;
  label: string;
  description: string;
  maxScore: number;
}

export interface InterviewPlan {
  id?: string;
  roleProfile: RoleProfile;
  candidateProfile?: CandidateProfile;
  questions: InterviewQuestion[];
  scorecard: ScorecardItem[];
  interviewerNotesHint: string;
  language: "en" | "ja";
}

export interface InterviewGenerateRequest {
  roleProfile: RoleProfile;
  candidateProfile?: CandidateProfile;
  language: "en" | "ja";
}

export interface InterviewGenerateResponse {
  interviewPlan: InterviewPlan;
}



