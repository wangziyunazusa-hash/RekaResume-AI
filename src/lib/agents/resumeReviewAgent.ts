import { callGeminiResumeReview } from '../gemini/client';
import type { ResumeReviewAgentInput, ResumeReviewAgentOutput, ResumeReviewAgentRunOptions } from './types';

export class ResumeReviewManagedAgent {
  async run(input: ResumeReviewAgentInput, options: ResumeReviewAgentRunOptions = {}): Promise<ResumeReviewAgentOutput> {
    this.validateInput(input);

    try {
      return await callGeminiResumeReview(input);
    } catch {
      if (options.allowMockFallback === false) {
        throw new Error('Resume review agent failed');
      }
      return createMockResumeReviewOutput(input);
    }
  }

  private validateInput(input: ResumeReviewAgentInput) {
    if (!input.candidate.currentRole.trim() || !input.candidate.mainTasks.trim()) {
      throw new Error('Candidate background is incomplete');
    }
    if (!input.targetJob.role.trim() || !input.targetJob.jobDescription.trim()) {
      throw new Error('Target job is incomplete');
    }
    if (!input.document.originalText.trim()) {
      throw new Error('Document text is incomplete');
    }
  }
}

export async function runResumeReviewManagedAgent(
  input: ResumeReviewAgentInput,
  options?: ResumeReviewAgentRunOptions,
) {
  const agent = new ResumeReviewManagedAgent();
  return agent.run(input, options);
}

function createMockResumeReviewOutput(input: ResumeReviewAgentInput): ResumeReviewAgentOutput {
  const currentRole = input.candidate.currentRole || '現在の職種';
  const targetRole = input.targetJob.role || '応募職種';
  const hasCustomerWork = includesAny(`${input.candidate.mainTasks} ${input.document.originalText}`, [
    '顧客',
    'お客様',
    'customer',
    'client',
    '接客',
    '営業',
  ]);
  const hasDataWork = includesAny(`${input.candidate.mainTasks} ${input.candidate.strengths}`, [
    'データ',
    '分析',
    '改善',
    'Excel',
    '数値',
  ]);
  const score = 74 + (hasCustomerWork ? 5 : 0) + (hasDataWork ? 4 : 0);

  return {
    score,
    candidateSummary: `${currentRole}として、${input.candidate.mainTasks.slice(0, 90)}${input.candidate.mainTasks.length > 90 ? '...' : ''} などの経験があります。特に ${input.candidate.strengths || '相手の状況を理解しながら業務を進める力'} が強みとして整理できます。`,
    jobSummary: `${targetRole}では、求人内容から見ると、業務理解、関係者との連携、課題を整理して成果につなげる力が重視されています。`,
    goodPoints: [
      hasCustomerWork
        ? '顧客対応や相手のニーズを把握する経験を、応募先での対人対応力として活かせます。'
        : '現在の業務経験を、課題整理力や実行力として応募書類に転用できます。',
      hasDataWork
        ? '業務改善やデータを扱った経験は、成果を説明する材料になります。'
        : '日々の業務で工夫した点を補足すると、再現性のある強みとして伝えられます。',
      '外国人求職者としての多言語・異文化理解は、企業によって差別化要素になります。',
    ],
    improvementPoints: [
      '原文は意欲が伝わりますが、企業にどう貢献できるかをもう少し前面に出すと良くなります。',
      '「頑張りました」「挑戦したい」だけでは具体性が弱いため、行動と成果が伝わる表現に変える必要があります。',
      '求人内容との接続を明確にし、応募先が求めるスキルに合わせて強みを並べ替えると説得力が増します。',
    ],
    missingInformation: [
      '具体的な成果数値や改善前後の変化',
      '応募企業を選んだ理由や事業内容への理解',
      '日本語を業務で使用した場面やレベル感',
    ],
    recommendedKeywords: [
      '顧客対応',
      '課題解決',
      '業務改善',
      'チーム連携',
      '提案力',
      '再現性',
    ],
    agentReasoningSummary: `現在の経験と ${targetRole} は完全に同じではない部分がありますが、業務理解、相手のニーズ把握、改善提案といった可迁移能力は応募書類で十分に訴求できます。`,
    improvedText: buildImprovedText(input),
    revisionReasons: [
      {
        before: pickBefore(input.document.originalText),
        after: '相手のニーズを丁寧に把握し、状況に応じた提案を行いました。',
        reason: '抽象的な努力表現ではなく、具体的な行動が伝わる表現に修正しました。',
      },
      {
        before: '日本でチャレンジしたいです。',
        after: 'これまで培った経験を活かし、日本市場における顧客課題の解決に貢献したいと考えております。',
        reason: '自己成長中心に聞こえる表現を、企業への貢献が伝わる表現へ変更しました。',
      },
    ],
    nextActions: [
      '具体的な成果数値を1つ追加する',
      '応募企業の事業内容と志望理由を接続する',
      '面接で話しやすい1分自己紹介を作成する',
    ],
  };
}

function buildImprovedText(input: ResumeReviewAgentInput) {
  const targetRole = input.targetJob.role || '応募職種';
  const contribution = input.targetJob.companyName
    ? `${input.targetJob.companyName}において`
    : '貴社において';

  if (input.document.type === 'motivation') {
    return `志望動機\n私が${targetRole}を志望する理由は、これまで培ってきた経験を活かし、${contribution}顧客や組織の課題解決に貢献したいと考えたためです。現職では、${input.candidate.mainTasks}を通じて、相手の状況を丁寧に把握し、必要な情報を整理しながら業務を進めてまいりました。\n\n求人内容を拝見し、${input.targetJob.requiredSkills || '関係者と連携しながら課題を解決する力'}が求められている点に強く関心を持ちました。入社後は、これまでの経験と学習意欲を活かし、早期に業務理解を深め、チームと顧客双方に役立つ行動を積み重ねてまいります。`;
  }

  if (input.document.type === 'interview_intro') {
    return `本日は貴重なお時間をいただき、ありがとうございます。私はこれまで${input.candidate.currentRole}として、${input.candidate.mainTasks}に取り組んでまいりました。特に、相手の状況を丁寧に理解し、必要な情報を整理して行動に移すことを強みとしております。${contribution}、これまでの経験を活かし、顧客やチームに貢献したいと考えております。本日はどうぞよろしくお願いいたします。`;
  }

  return `自己PR\n私の強みは、相手のニーズを丁寧に把握し、状況に応じて必要な行動を考えられる点です。これまで${input.candidate.currentRole}として、${input.candidate.mainTasks}を担当してきました。その中で、単に任された業務を進めるだけでなく、相手が何に困っているのか、どのようにすればより円滑に進むのかを意識して行動してまいりました。\n\nこの経験は、${targetRole}においても、顧客や社内メンバーと連携しながら課題を整理し、着実に成果へつなげる力として活かせると考えております。`;
}

function pickBefore(originalText: string) {
  const firstSentence = originalText.split(/[。.\n]/).find((item) => item.trim());
  return firstSentence ? `${firstSentence.trim()}。` : 'お客様対応を頑張りました。';
}

function includesAny(text: string, keywords: string[]) {
  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}
