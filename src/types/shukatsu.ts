export type CandidateType =
  | 'new_grad'
  | 'second_new_grad'
  | 'career_change'
  | 'experienced'
  | 'unknown';

export type LanguageMode =
  | 'n2_friendly'
  | 'business'
  | 'interview'
  | 'furigana';

export type DocumentType =
  | 'career_summary'
  | 'self_pr'
  | 'motivation'
  | 'career_change_reason'
  | 'gakuchika'
  | 'one_minute_intro'
  | 'reverse_questions'
  | 'contribution';

export type InterviewType =
  | 'new_grad'
  | 'career_change'
  | 'second_new_grad'
  | 'inexperienced_role'
  | 'final';

export type ApplicationStage =
  | '気になる'
  | '書類準備中'
  | '応募済み'
  | '書類選考中'
  | '一次面接'
  | '二次面接'
  | '最終面接'
  | '内定'
  | '不合格';

export interface CandidateProfile {
  id: string;
  currentRole: string;
  currentIndustry: string;
  yearsOfExperience: string;
  languages: string[];
  targetRole: string;
  targetIndustry: string;
  candidateType: CandidateType;
}

export interface JobMatchInput {
  profile: CandidateProfile;
  resumeText: string;
  jobText: string;
  uploadedFileNames: string[];
}

export interface JobMatchResult {
  matchScore: number;
  jobSummary: string;
  candidateSummary: string;
  strongMatches: string[];
  transferableSkills: string[];
  riskPoints: string[];
  missingInfo: string[];
  applicationStrategy: string[];
  recommendedKeywords: string[];
  suggestedDocuments: DocumentType[];
}

export interface GeneratedDocument {
  id: string;
  type: DocumentType;
  languageMode: LanguageMode;
  content: string;
  explanation: string;
  createdAt: string;
}

export interface PoliteExpressionFix {
  original: string;
  better: string;
  reason: string;
}

export interface InterviewFeedback {
  contentScore: number;
  businessJapaneseScore: number;
  structureScore: number;
  naturalnessScore: number;
  culturalFitScore: number;
  feedback: string[];
  politeExpressionFixes: PoliteExpressionFix[];
  improvedAnswer: string;
  followUpQuestions: string[];
}

export interface ApplicationItem {
  id: string;
  companyName: string;
  roleName: string;
  stage: ApplicationStage;
  nextAction: string;
  deadline: string;
  memo: string;
  linkedDocuments: string[];
  linkedInterviewNotes: string[];
  createdAt: string;
}
