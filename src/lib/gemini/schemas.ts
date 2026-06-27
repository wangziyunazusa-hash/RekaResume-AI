import type { ResumeReviewAgentOutput } from '../agents/types';

const stringArrayKeys = [
  'goodPoints',
  'improvementPoints',
  'missingInformation',
  'recommendedKeywords',
  'nextActions',
] as const;

export function validateResumeReviewOutput(value: unknown): ResumeReviewAgentOutput {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid agent output');
  }

  const data = value as Record<string, unknown>;
  const requiredStrings = ['candidateSummary', 'jobSummary', 'agentReasoningSummary', 'improvedText'];
  for (const key of requiredStrings) {
    if (typeof data[key] !== 'string') {
      throw new Error(`Invalid agent output: ${key}`);
    }
  }

  if (typeof data.score !== 'number') {
    throw new Error('Invalid agent output: score');
  }

  for (const key of stringArrayKeys) {
    if (!Array.isArray(data[key]) || !(data[key] as unknown[]).every((item) => typeof item === 'string')) {
      throw new Error(`Invalid agent output: ${key}`);
    }
  }

  if (!Array.isArray(data.revisionReasons)) {
    throw new Error('Invalid agent output: revisionReasons');
  }

  const revisionReasons = data.revisionReasons.map((item) => {
    const reason = item as Record<string, unknown>;
    return {
      before: typeof reason.before === 'string' ? reason.before : '',
      after: typeof reason.after === 'string' ? reason.after : '',
      reason: typeof reason.reason === 'string' ? reason.reason : '',
    };
  });

  return {
    score: Math.max(0, Math.min(100, Math.round(data.score))),
    candidateSummary: data.candidateSummary,
    jobSummary: data.jobSummary,
    goodPoints: data.goodPoints,
    improvementPoints: data.improvementPoints,
    missingInformation: data.missingInformation,
    recommendedKeywords: data.recommendedKeywords,
    agentReasoningSummary: data.agentReasoningSummary,
    improvedText: data.improvedText,
    revisionReasons,
    nextActions: data.nextActions,
  } as ResumeReviewAgentOutput;
}
