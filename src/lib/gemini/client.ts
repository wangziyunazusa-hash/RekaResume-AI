import { buildResumeReviewUserPrompt, RESUME_REVIEW_AGENT_SYSTEM_PROMPT } from './prompts';
import { validateResumeReviewOutput } from './schemas';
import type { ResumeReviewAgentInput, ResumeReviewAgentOutput } from '../agents/types';

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

declare const process: { env?: Record<string, string | undefined> } | undefined;

function getServerGeminiApiKey() {
  if (typeof process === 'undefined') return '';
  return process.env?.GEMINI_API_KEY || '';
}

export function hasServerGeminiApiKey() {
  return Boolean(getServerGeminiApiKey());
}

export async function callGeminiResumeReview(input: ResumeReviewAgentInput): Promise<ResumeReviewAgentOutput> {
  const apiKey = getServerGeminiApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key is not configured');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const inputJson = JSON.stringify(input, null, 2);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${RESUME_REVIEW_AGENT_SYSTEM_PROMPT}\n\n${buildResumeReviewUserPrompt(inputJson)}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Gemini request failed');
  }

  const payload = (await response.json()) as GeminiResponse;
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  return validateResumeReviewOutput(JSON.parse(text));
}
