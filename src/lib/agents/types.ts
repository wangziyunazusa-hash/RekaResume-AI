export type ResumeReviewDocumentType =
  | 'self_pr'
  | 'motivation'
  | 'career_summary'
  | 'work_experience'
  | 'gakuchika'
  | 'interview_intro';

export type ResumeReviewTone = 'natural' | 'business' | 'interview' | 'n2';

export interface ResumeReviewAgentInput {
  candidate: {
    currentRole: string;
    currentIndustry: string;
    yearsOfExperience: string;
    mainTasks: string;
    strengths: string;
    additionalInfo?: string;
  };
  targetJob: {
    role: string;
    industry: string;
    companyName?: string;
    jobDescription: string;
    requiredSkills?: string;
  };
  document: {
    type: ResumeReviewDocumentType;
    originalText: string;
    tone: ResumeReviewTone;
  };
}

export interface RevisionReason {
  before: string;
  after: string;
  reason: string;
}

export interface ResumeReviewAgentOutput {
  score: number;
  candidateSummary: string;
  jobSummary: string;
  goodPoints: string[];
  improvementPoints: string[];
  missingInformation: string[];
  recommendedKeywords: string[];
  agentReasoningSummary: string;
  improvedText: string;
  revisionReasons: RevisionReason[];
  nextActions: string[];
}

export interface ResumeReviewAgentRunOptions {
  allowMockFallback?: boolean;
}
