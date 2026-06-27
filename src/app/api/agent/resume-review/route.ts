import { runResumeReviewManagedAgent } from '../../../../lib/agents/resumeReviewAgent';
import type { ResumeReviewAgentInput } from '../../../../lib/agents/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResumeReviewAgentInput;
    validateRequest(body);
    const output = await runResumeReviewManagedAgent(body, { allowMockFallback: true });

    return Response.json(output, { status: 200 });
  } catch {
    return Response.json(
      {
        message: 'AI添削中にエラーが発生しました。少し時間をおいて再度お試しください。',
      },
      { status: 400 },
    );
  }
}

function validateRequest(body: ResumeReviewAgentInput) {
  if (!body?.candidate?.currentRole || !body.candidate.mainTasks) {
    throw new Error('Candidate background is required');
  }
  if (!body?.targetJob?.role || !body.targetJob.jobDescription) {
    throw new Error('Target job is required');
  }
  if (!body?.document?.originalText || !body.document.type || !body.document.tone) {
    throw new Error('Document input is required');
  }
}
