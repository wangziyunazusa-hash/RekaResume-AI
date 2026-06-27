import type {
  DocumentType,
  GeneratedDocument,
  InterviewFeedback,
  InterviewType,
  JobMatchInput,
  JobMatchResult,
  LanguageMode,
} from '../types/shukatsu';

const wait = (ms = 700) => new Promise((resolve) => setTimeout(resolve, ms));

const has = (text: string, terms: string[]) =>
  terms.some((term) => text.toLowerCase().includes(term.toLowerCase()));

export async function analyzeJobMatch(input: JobMatchInput): Promise<JobMatchResult> {
  await wait();
  const combined = `${input.resumeText}\n${input.jobText}\n${input.profile.currentRole}\n${input.profile.targetRole}`;
  const aiSignals = has(combined, ['ai', 'gemini', '生成', 'データ', '分析', 'dx']);
  const customerSignals = has(combined, ['customer', 'client', '顧客', '法人', '営業', '折衝']);
  const productSignals = has(combined, ['product', '企画', '要件定義', 'pm', 'プロダクト']);
  const japaneseRisk = !has(combined, ['n1', 'n2', '日本語', 'jlpt', 'ビジネス日本語']);
  const score = 64 + (aiSignals ? 8 : 0) + (customerSignals ? 7 : 0) + (productSignals ? 9 : 0);

  return {
    matchScore: Math.min(score, 92),
    jobSummary:
      input.jobText.trim() || input.profile.targetRole
        ? `${input.profile.targetRole || '対象職種'}では、求人内容の理解、関係者との調整、課題を整理して成果につなげる力が重視されます。`
        : '求人票の情報が不足しています。職務内容、必須条件、歓迎条件を追加すると分析精度が上がります。',
    candidateSummary:
      input.resumeText.trim() || input.profile.currentRole
        ? `${input.profile.currentRole || '候補者'}としての経験を軸に、${input.profile.languages.join('・') || '複数言語'}を活かしたコミュニケーションと異文化理解が強みです。`
        : '候補者情報が不足しています。職務内容、成果、使用ツール、語学力を追加してください。',
    strongMatches: [
      customerSignals
        ? '顧客対応・関係者調整の経験が、日本企業で重視される社内外コミュニケーションに活かせます。'
        : '異文化環境での学習・適応経験は、外国人採用におけるポテンシャル評価につながります。',
      productSignals
        ? '要件定義や企画に近い経験があり、求人の上流工程・改善業務と接続できます。'
        : '現在の経験を「課題発見」「改善提案」「実行管理」に言い換えることで訴求できます。',
      aiSignals
        ? 'AI / データ活用への関心や経験は、DX推進・業務改善系ポジションで評価されやすい要素です。'
        : '語学力と海外視点は、グローバル顧客・海外展開のある企業で差別化要素になります。',
    ],
    transferableSkills: [
      '課題を整理し、相手に分かりやすく伝える力',
      '多文化環境でのコミュニケーション力',
      '未経験領域をキャッチアップする学習継続力',
      '顧客視点で業務改善を考える力',
    ],
    riskPoints: [
      japaneseRisk
        ? 'ビジネス日本語レベルが読み取りづらいため、JLPT・業務での日本語使用経験を補足すると安心感が増します。'
        : '日本語力は強みになり得ますが、面接では敬語と結論先行の回答を練習する必要があります。',
      '成果の定量化が弱い場合、職務経歴書で説得力が落ちる可能性があります。',
      '日本企業での実務経験が少ない場合、働き方への理解と適応姿勢を具体的に示す必要があります。',
    ],
    missingInfo: [
      '情報不足: 具体的な成果数値、担当範囲、プロジェクト規模',
      '情報不足: 日本語使用場面、JLPT、面接で話せるエピソード',
      '情報不足: 応募企業を選んだ理由と事業理解',
    ],
    applicationStrategy: [
      `${input.profile.targetRole || '対象職種'}では「自分が成長したい」よりも「貴社にどう貢献できるか」を前面に出します。`,
      '志望動機は、日本市場・顧客課題・企業事業との接続を明確にします。',
      '職務経歴書では、海外経験を日本企業が理解しやすい「再現可能な行動」と「成果」に変換します。',
      '面接では、短く結論を述べたあと、背景・行動・成果の順で話す練習をします。',
    ],
    recommendedKeywords: [
      '要件定義',
      '業務改善',
      '顧客折衝',
      '多文化環境',
      '日本市場理解',
      '課題解決',
      '再現性',
    ],
    suggestedDocuments: ['career_summary', 'self_pr', 'motivation', 'one_minute_intro'],
  };
}

export async function generateDocument(args: {
  type: DocumentType;
  languageMode: LanguageMode;
  resumeText: string;
  jobText: string;
  extraInfo: string;
  matchResult?: JobMatchResult | null;
}): Promise<GeneratedDocument> {
  await wait();
  const contentByType: Record<DocumentType, string> = {
    career_summary:
      '職務要約\nこれまで、顧客対応・業務改善・関係者調整を中心に経験を積んでまいりました。特に、相手の課題を丁寧に把握し、状況に応じて必要な情報を整理して提案することを強みとしております。今後は、これまで培った多文化環境でのコミュニケーション力と課題解決力を活かし、日本市場における事業成長に貢献したいと考えております。',
    self_pr:
      '自己PR\n私の強みは、異なる背景を持つ相手の意図をくみ取り、課題を整理したうえで行動に移せる点です。これまでの経験では、相手の要望をそのまま受け取るだけでなく、背景にある目的や困りごとを確認し、より良い進め方を提案してきました。この姿勢は、貴社においても顧客理解や社内連携を円滑に進めるうえで活かせると考えております。',
    motivation:
      '志望動機\n貴社を志望する理由は、日本市場における顧客課題の解決に、これまで培ってきた経験を活かして貢献したいと考えたためです。私は、異文化環境で相手の考えを理解しながら業務を進めてきた経験があります。貴社の事業内容と求人で求められる役割を拝見し、顧客の課題を正確に理解し、関係者と連携しながら改善を進める点に強く魅力を感じました。',
    career_change_reason:
      '転職理由\nこれまでの経験を通じて、より広い範囲で顧客や組織の課題解決に関わりたいと考えるようになりました。現職で培ったコミュニケーション力と実行力を活かしつつ、今後は日本企業の事業成長に直接貢献できる環境で専門性を高めたいと考え、転職を検討しております。',
    gakuchika:
      '学生時代に力を入れたこと\n学生時代は、多様な価値観を持つメンバーと協力しながら目標を達成する活動に力を入れました。意見が分かれる場面では、まず相手の背景や目的を確認し、共通のゴールを整理することを意識しました。その結果、チームとして納得感のある形で計画を進めることができました。',
    one_minute_intro:
      '1分自己紹介\n本日は貴重なお時間をいただき、ありがとうございます。私はこれまで、顧客対応や業務改善、関係者との調整を中心に経験を積んでまいりました。特に、相手の課題を丁寧に聞き取り、必要な情報を整理して行動につなげることを強みとしております。貴社では、この経験と多文化環境で培ったコミュニケーション力を活かし、顧客理解と事業成長に貢献したいと考えております。本日はどうぞよろしくお願いいたします。',
    reverse_questions:
      '逆質問\n1. 入社後、早期に成果を出している方に共通する行動や姿勢を教えていただけますでしょうか。\n2. このポジションで、最初の3か月に特に期待される役割は何でしょうか。\n3. 外国籍社員が活躍するために、チームで大切にされているコミュニケーションの工夫はありますでしょうか。',
    contribution:
      '入社後に貢献できること\n入社後は、これまで培ってきた多文化環境でのコミュニケーション力と課題整理力を活かし、顧客や社内メンバーとの認識合わせを丁寧に行います。また、業務の背景や目的を理解したうえで、自ら必要な知識を学び、早期にチームへ貢献できるよう努めます。',
  };

  let content = contentByType[args.type];
  if (args.languageMode === 'n2_friendly') {
    content = content.replaceAll('貢献', '役に立つこと').replaceAll('関係者', '一緒に働く人');
  }
  if (args.languageMode === 'interview') {
    content = content.replaceAll('。', '。\n');
  }
  if (args.languageMode === 'furigana') {
    content = content
      .replaceAll('志望動機', '志望動機（しぼうどうき）')
      .replaceAll('貢献', '貢献（こうけん）')
      .replaceAll('課題解決', '課題解決（かだいかいけつ）')
      .replaceAll('職務経歴書', '職務経歴書（しょくむけいれきしょ）');
  }

  return {
    id: crypto.randomUUID(),
    type: args.type,
    languageMode: args.languageMode,
    content,
    explanation:
      '直訳ではなく、日本企業が重視する「企業への貢献」「再現性」「具体的な行動」が伝わる構成に調整しました。自己成長だけでなく、応募先にどう役立てるかを中心にしています。',
    createdAt: new Date().toISOString(),
  };
}

export function getInterviewQuestion(type: InterviewType, role: string): string {
  const target = role || '応募ポジション';
  const questions: Record<InterviewType, string> = {
    new_grad: '学生時代に最も力を入れたことについて教えてください。',
    career_change: `なぜこれまでの経験を活かして、${target}に挑戦したいと考えていますか。`,
    second_new_grad: '前職で学んだことと、今後改善したい点を教えてください。',
    inexperienced_role: `未経験で${target}に応募するうえで、どのようにキャッチアップしていきますか。`,
    final: '入社後、どのように当社へ貢献したいと考えていますか。',
  };
  return questions[type];
}

export async function evaluateInterviewAnswer(answer: string): Promise<InterviewFeedback> {
  await wait();
  const hasMetric = /\d|％|%|件|人|ヶ月|年/.test(answer);
  const isShort = answer.trim().length < 80;

  return {
    contentScore: isShort ? 6 : 8,
    businessJapaneseScore: has(answer, ['頑張', 'すごく', 'やばい']) ? 5 : 7,
    structureScore: hasMetric ? 8 : 6,
    naturalnessScore: isShort ? 7 : 6,
    culturalFitScore: has(answer, ['貢献', '御社', '貴社', '顧客']) ? 8 : 6,
    feedback: [
      isShort
        ? '回答の方向性は良いですが、背景・行動・成果をもう少し補足すると説得力が上がります。'
        : '内容は十分ですが、面接では一文を短くし、結論から話すとさらに伝わりやすくなります。',
      hasMetric
        ? '成果を数字で示せている点は良いです。'
        : '成果や規模を数字で補足すると、職務経験の具体性が高まります。',
      '志望理由や自己PRでは、自分の成長だけでなく、応募企業にどう貢献できるかを明確にしましょう。',
    ],
    politeExpressionFixes: [
      {
        original: '頑張りました',
        better: '主体的に推進しました',
        reason: 'ビジネス面接では、努力よりも行動と役割が伝わる表現が適切です。',
      },
      {
        original: '御社のサービスが好きです',
        better: '貴社のサービスを通じて、顧客の業務改善に貢献したいと考えております',
        reason: '好意だけでなく、企業への貢献意欲を示す表現にすると評価されやすくなります。',
      },
    ],
    improvedAnswer:
      '私がこのポジションを志望する理由は、これまで培ってきた顧客対応力と課題整理力を活かし、貴社の事業成長に貢献したいと考えたためです。前職では、相手の要望を丁寧に確認し、関係者と連携しながら改善策を進めてきました。入社後は、まず貴社の業務理解を深め、顧客の課題を正確に把握したうえで、チームに早期に貢献できるよう努めます。',
    followUpQuestions: [
      'その経験で最も難しかった点は何ですか。',
      '周囲を巻き込むために、具体的にどのような工夫をしましたか。',
      '入社後に最初に学びたいことは何ですか。',
    ],
  };
}

export function createWeeklyActionPlan(count: number): string[] {
  return [
    count > 0 ? '優先度の高い応募先を2社選び、求人票の必須条件を再確認する' : '気になる企業を3社リストアップする',
    '職務経歴書のプロジェクト経験に成果数値を1つ追加する',
    '志望動機を「事業理解」「経験の接続」「入社後の貢献」の3段落で整理する',
    '日本語面接質問を5問練習し、回答を録音またはテキストで見直す',
    '次回面接用の逆質問を3つ準備する',
  ];
}
