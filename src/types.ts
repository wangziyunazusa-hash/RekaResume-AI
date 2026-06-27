export type CandidateType = 'new_grad' | 'second_new_grad' | 'career_changer' | 'cross_industry' | 'undecided';

export interface BackgroundData {
  candidateType: CandidateType;
  
  // A. Current career / experience
  currentOccupation: string;
  currentIndustry: string;
  yearsOfExperience: string;
  keyTasks: string;
  achievements: string;
  toolsSkills: string;
  
  // B. Target career
  targetOccupation: string;
  targetIndustry: string;
  targetJd: string;
  emphasizedSkills: string;
  avoidContent: string;
  
  // C. Usage Preferences
  resumeLang: 'ja' | 'en' | 'zh' | 'bilingual';
  toneStyle: 'professional' | 'modest' | 'enthusiastic' | 'concise' | 'second_new_grad';
  
  // D. Original Resume text
  originalSelfPr: string;
  originalMotivation: string;
  originalWorkExperience: string;
  originalStudentExperience: string;
  originalSkills: string;
}

export interface BeforeAfterItem {
  before: string;
  after: string;
  reason: string;
}

export interface ImprovedSections {
  self_pr: string;
  motivation: string;
  career_summary: string;
  work_experience: string;
  student_experience: string;
  skills: string;
}

export interface AIResponse {
  score: number;
  candidate_type: string;
  career_context_summary: string;
  target_job_summary: string;
  summary: string;
  matched_points: string[];
  transferable_skills: string[];
  weak_points: string[];
  missing_information: string[];
  recommended_keywords: string[];
  rewrite_strategy: string;
  rewrite_suggestions: string[];
  improved_sections: ImprovedSections;
  before_after: BeforeAfterItem[];
}

export interface AppSettings {
  apiKey: string;
  model: string;
  useMockMode: boolean;
}
