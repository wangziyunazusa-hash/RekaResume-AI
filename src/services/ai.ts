import type { BackgroundData, AIResponse, AppSettings } from '../types';

// System prompt to guide Gemini to act as a career advisor and output structured JSON
const SYSTEM_PROMPT = `
You are a highly experienced Career Advisor and Resume Consultant at a top Japanese HR agency.
Your task is to analyze the candidate's current background, target job details, and original resume draft to provide a structured, professional resume rewrite and career strategy assessment.

Follow these strict rules:
1. Never fabricate experiences, qualifications, or numbers. If details are missing, put them in the 'missing_information' array and flag them as '[情報不足]' in the text.
2. Carefully identify transferable skills ('transferable_skills') from the candidate's current experience that are highly relevant to the target job.
3. If they are switching industries (異業界転職) or job roles (異職種転職), strengthen their transition logic and highlight soft skills like coordination, communication, or learning adaptability.
4. If they are in the same occupation (同職種転職), emphasize specialized technical skills, achievements, metrics, and instant contribution capability (即戦力).
5. If they are a new graduate (新卒) or second new graduate (第二新卒), emphasize potential (ポテンシャル), learning speed, initiative, and reproducibility of their positive habits (再現性).
6. Rewrite the provided resume sections in the selected output language. If 'ja' (Japanese) is selected, use natural, polite business Japanese (です/ます or だ/である). If 'en' (English) is selected, use formal, professional English. If 'zh' (Chinese) is selected, use professional business Chinese. If 'bilingual' is selected, output sections containing both Japanese/English or Japanese/Chinese content.
7. Output MUST be valid, well-formatted JSON matching the schema provided below. Do not include any other conversational text or wrappers outside the JSON structure.

Required JSON Structure:
{
  "score": 0-100 (integer representing match score),
  "candidate_type": "新卒 / 第二新卒 / 同職種転職 / 異業界・異職種転職 / キャリアチェンジ",
  "career_context_summary": "Summary of current experience and core strengths in Japanese",
  "target_job_summary": "Summary of target job requirements and key success factors",
  "summary": "High-level overview of suitability, synergy, and main improvement areas",
  "matched_points": ["Point 1", "Point 2"],
  "transferable_skills": ["Skill 1", "Skill 2"],
  "weak_points": ["Weak point / gap 1", "Weak point / gap 2"],
  "missing_information": ["Missing info 1", "Missing info 2"],
  "recommended_keywords": ["Keyword 1", "Keyword 2"],
  "rewrite_strategy": "Concrete strategy explanation on how the resume was adjusted",
  "rewrite_suggestions": ["Advice 1", "Advice 2"],
  "improved_sections": {
    "self_pr": "Improved Self-PR section",
    "motivation": "Improved Motivation (志望動機) section",
    "career_summary": "Improved Brief Career Summary (経歴要約)",
    "work_experience": "Improved Detailed Work History / Student Activities description",
    "student_experience": "Improved Student Life / Club Activities description (mainly for new grads)",
    "skills": "Improved Skills / Tools lists and qualification descriptions"
  },
  "before_after": [
    {
      "before": "Original phrasing",
      "after": "Improved phrasing",
      "reason": "Why this change was made"
    }
  ]
}
`;

function buildUserPrompt(data: BackgroundData): string {
  return `
Analyze and rewrite the resume based on the following details:

--- CANDIDATE DETAILS ---
Candidate Type: ${data.candidateType}
Current Occupation: ${data.currentOccupation}
Current Industry: ${data.currentIndustry}
Years of Experience: ${data.yearsOfExperience}
Current Key Tasks: ${data.keyTasks}
Achievements / Metrics: ${data.achievements}
Tools & Skills: ${data.toolsSkills}

--- TARGET DETAILS ---
Target Occupation: ${data.targetOccupation}
Target Industry: ${data.targetIndustry}
Target Job Description (JD):
${data.targetJd}

Emphasized Skills Requested: ${data.emphasizedSkills}
Content to Avoid: ${data.avoidContent}

--- PREFERENCES ---
Output Language: ${data.resumeLang}
Tone Style: ${data.toneStyle}

--- ORIGINAL RESUME SECTIONS ---
[Self-PR (自己PR)]
${data.originalSelfPr || '(Empty)'}

[Motivation (志望動機)]
${data.originalMotivation || '(Empty)'}

[Work History (職務経歴)]
${data.originalWorkExperience || '(Empty)'}

[Student Activities (ガクチカ / 学生時代経験)]
${data.originalStudentExperience || '(Empty)'}

[Skills & Qualifications]
${data.originalSkills || '(Empty)'}
`;
}

// Generates simulated analysis results when API key is not present or mock mode is active
function getRawMockResponse(data: BackgroundData): AIResponse {
  const current = data.currentOccupation || '販売員';
  const target = data.targetOccupation || 'IT営業';
  
  // Custom heuristics to build an amazingly detailed, personalized mock response
  const isRetailToIT = current.includes('販売') && target.toLowerCase().includes('it');
  const isTeacherToHR = (current.includes('教') || current.toLowerCase().includes('teacher')) && (target.toLowerCase().includes('hr') || target.includes('人事'));
  const isSEtoPM = (current.toLowerCase().includes('se') || current.includes('エンジニア')) && (target.toLowerCase().includes('pm') || target.includes('プロダクトマネージャー'));
  const isNewGrad = data.candidateType === 'new_grad';

  if (isRetailToIT) {
    return {
      score: 78,
      candidate_type: "異業界・異職種転職 (店舗販売からIT営業)",
      career_context_summary: `アパレル・小売業界での${data.yearsOfExperience || '3年'}の店舗販売経験。接客による顧客ニーズのヒアリング能力と、店舗売上目標の達成に向けた販売計画の立案・実行力を有する。`,
      target_job_summary: `${data.targetIndustry || 'IT・SaaS'}業界における法人営業職。顧客企業の業務課題を抽出し、自社ITソリューションによる解決提案を行う役割。高いコミュニケーション能力と論理的提案力が求められる。`,
      summary: "直接のIT法人営業経験はありませんが、店舗接客で培った「顧客の潜在ニーズを引き出すヒアリング力」と「店舗数値の目標管理能力」は非常に親和性が高いです。これらを『提案型営業』および『目標達成への執着力』として再定義しアピールします。",
      matched_points: [
        "接客でのコミュニケーション能力（顧客対応・折衝力）",
        "店舗売上などの目標達成意識（数値へのこだわり）",
        "チーム内での新人教育・リーダーシップ経験"
      ],
      transferable_skills: [
        "課題発見ヒアリング能力 (顧客の困りごとを捉える力)",
        "目標達成思考 (PDCAサイクルによる改善提案)",
        "プレゼンテーションスキル (商品の魅力・価値訴求)"
      ],
      weak_points: [
        "法人営業経験（BtoB商習慣の理解）の不足",
        "ITテクノロジーやシステム開発プロセスに関する基礎知識"
      ],
      missing_information: [
        "店舗売上の前年比成長率などの具体的な数値（例：前年比120%など）",
        "店舗で使用していた売上管理ツールやPOSシステムの名称"
      ],
      recommended_keywords: ["顧客ヒアリング", "課題解決型提案", "PDCAサイクル", "目標達成率", "即戦力化"],
      rewrite_strategy: "店舗販売の『接客』を『課題ヒアリング』に、『販売実績』を『売上目標達成プロセス』と言い換え、BtoB営業でも再現可能な汎用スキルとして表現を最適化しました。",
      rewrite_suggestions: [
        "単に「服を売った」ではなく、「顧客の着用シーンの悩みを解消する提案を行い、セット率向上を図った」とプロセスを重視して記載してください。",
        "IT知識について「現在、基本情報技術者の学習中」などの自己研鑽姿勢を追加するとポテンシャルが評価されやすくなります。"
      ],
      improved_sections: {
        self_pr: `【自己PR：顧客のニーズに合わせた提案力と数値コミット力】
店舗での接客販売においては、単に商品の説明をするのではなく、お客様の着用シーンやライフスタイルに徹底して寄り添う「課題解決型ヒアリング」を行ってまいりました。その結果、来店されるお客様の客単価を平均15%向上させ、店舗目標の達成に貢献しました。
この「顧客ニーズを読み解き、価値を提案する力」は、IT営業において顧客企業の課題を把握し、最適なITツールを提案・導入支援するプロセスに直接応用可能です。`,
        motivation: `【志望動機】
小売店舗での接客経験を通じ、対面での顧客支援にやりがいを感じる一方で、より企業の根本的な業務効率化やビジネス成長に貢献したいと考え、IT製品を扱う法人営業を志望いたしました。
貴社が展開する業務効率化SaaSは、私が前職の店舗管理で課題に感じていた『アナログなシフト・売上管理』を劇的に変えるサービスであり、強い共感を抱いております。
店舗で培った「徹底したニーズヒアリング力」と「売上目標を達成するための行動管理」を活かし、顧客企業のDX推進にいち早く貢献したいと考えております。`,
        career_summary: `アパレル店舗における接客・販売および店舗運営支援。顧客の潜在的なニーズを引き出す提案により個人売上店舗No.1を達成。新人スタッフの教育も担当。`,
        work_experience: `■店舗運営・接客販売業務
・顧客のニーズに合わせた課題解決型の接客提案（単価アップの施策立案）
・店舗売上データの分析に基づく、人気商品の陳列配置の変更と在庫適正化の実行
・新人アルバイトスタッフ3名の育成・研修マニュアルの整備
【成果】個人月間売上最高320万円（目標比115%達成）、店舗全体の接客満足度表彰にて優秀スタッフに選出`,
        student_experience: `大学時代、飲食店でのアルバイトリーダーとしてシフト管理とオペレーション改善を担当。顧客の回転率を10%向上させるマニュアル作成を実施。`,
        skills: `【スキル】
・課題解決型提案・ヒアリング能力
・数値分析・目標管理 (売上・在庫管理)
・ビジネスソフト: Microsoft Office (Excel, PowerPoint, Word), Slack, Zoom
・資格: 販売士2級 / ITパスポート（現在学習中、2026年9月受験予定）`
      },
      before_after: [
        {
          before: "お店でお客様にアパレル商品を勧めて売っていました。売上もがんばりました。",
          after: "アパレル店舗において顧客の着用シーンや潜在的なニーズに応える『提案型接客』を導入し、客単価の15%向上と月間個人売上目標115%を達成しました。",
          reason: "単なる作業の記述から、ビジネスで評価される「プロセス」「具体的な成果指標（%）」「再現性のあるスキル表記」へとアップグレードしました。"
        }
      ]
    };
  }

  if (isTeacherToHR) {
    return {
      score: 82,
      candidate_type: "異業界転職 (教育から企業人事・採用)",
      career_context_summary: `英語教室での${data.yearsOfExperience || '4年'}の講師および教室運営経験。受講生の目標設定やモチベーション管理、保護者とのリレーション構築力を有する。`,
      target_job_summary: `事業会社での採用担当・育成担当。学生や求職者へのアプローチ、面談、入社後のオンボーディング支援。`,
      summary: "教育現場における「個人の目標達成を支援するコミュニケーション能力」や「面談を通じた動機付けスキル」は、人事・採用における求職者アトラクトや社員育成プログラムと高いシナジーがあります。これを人事領域の専門用語に翻訳してアピールします。",
      matched_points: [
        "個人の資質を見抜く・傾聴するヒアリング能力",
        "受講継続を促すための動機付け（モチベーションマネジメント）",
        "新規入会者を増やすための説明会運営などのプレゼンテーション"
      ],
      transferable_skills: [
        "ファシリテーション＆プレゼンテーション能力",
        "モチベーション設計・心理的安全性構築",
        "保護者対応によるマルチステークホルダー調整力"
      ],
      weak_points: [
        "企業における労務管理や法規制（労働基準法等）の知識不足",
        "中途・新卒採用の市場トレンドやチャネル選定（求人媒体、エージェント）の経験不足"
      ],
      missing_information: [
        "入会率・継続率などの担当教室の定量データ（例：退会率を5%以下に維持など）",
        "講師の管理・育成（シフト調整、授業指導）などのマネジメント経験の有無"
      ],
      recommended_keywords: ["モチベーションマネジメント", "アトラクト", "面談・カウンセリング", "母集団形成", "関係構築"],
      rewrite_strategy: "『教える・教育する』という表現から『対象者の特性に合わせたコミュニケーション・伴走支援』へと抽象度を上げ、企業における『採用候補者のアトラクト』『社員のオンボーディング・エンゲージメント向上』に役立つポータブルスキルとして記述を整えました。",
      rewrite_suggestions: [
        "生徒だけでなく、その背後にいる「保護者」との折衝経験を『多様な関係者との調整力』として記述すると、ビジネスシーンでの信頼感が増します。"
      ],
      improved_sections: {
        self_pr: `【自己PR：伴走型コミュニケーションと課題分析に基づく信頼構築】
英語講師として年間約100名の生徒およびその保護者と向き合い、それぞれの学習課題やモチベーションの波に合わせた個別最適な指導プランを策定・実施してまいりました。
この「個人の目標や課題を真摯に傾聴し、解決に向けて伴走する力」は、人事職において求職者のキャリアプランに寄り添い、自社とのマッチングを図る採用業務や、入社後の定着を促すフォロー面談において大いに発揮できると確信しております。`,
        motivation: `【志望動機】
スクール運営において受講生の成長を一番近くで支援する中で、「個人の資質が最大限に活かされる場を作ること」に強い意義を感じるようになり、企業組織を支える人事・採用職を志望いたしました。
貴社が推進されている多様な働き方と主体的なキャリア支援の姿勢に強く共感しております。講師として培った「人を惹きつけるプレゼンテーション力」を会社説明会などに活かし、「個の課題を解きほぐすカウンセリング力」で求職者・社員に伴走することで、優秀な人材の獲得とエンゲージメント向上に貢献したいです。`,
        career_summary: `英語スクールにおけるレッスン担当および教室運営業務。生徒の学習指導のみならず、保護者面談を通じた受講継続の提案や、体験レッスンの企画運営による新規獲得を担当。`,
        work_experience: `■英会話スクールの運営・講師業務
・幼児から社会人まで幅広い層へのレッスン提供（週約25クラス担当）
・定期的な学習進捗フィードバックおよびカウンセリング面談の実施
・保護者会やシーズナルイベントの企画・ディレクション
【成果】担当クラスの受講継続率96％（全社平均90％）を達成、体験レッスンからの当日入会率前年比12%向上`,
        student_experience: `大学時代のサークル活動にて、新入生の歓迎イベントの企画担当として動員数を前年比1.5倍に増加させた経験があります。`,
        skills: `【スキル】
・プレゼンテーション・講義ファシリテーション能力
・傾聴・カウンセリングによるモチベーション支援
・語学力: 英語（TOEIC 850点 / ビジネスレベル）
・オフィスツール: G Suite (Docs, Sheets, Slides), Slack, Notion`
      },
      before_after: [
        {
          before: "生徒に英語を教えていました。保護者の面談や、入会を増やすための体験レッスンもやりました。",
          after: "受講生の目標達成を支援するメンターとして進捗カウンセリングを実施し、顧客エンゲージメントを示す継続率で全社平均を上回る96%を維持。また体験イベントの企画立案により新規入会率を12%改善しました。",
          reason: "「先生」としての授業活動の枠を超えて、組織の「リテンション向上（継続率）」「新規獲得（CVR）」というビジネス視点の成果として再構築しました。"
        }
      ]
    };
  }

  if (isSEtoPM) {
    return {
      score: 85,
      candidate_type: "同職種・キャリアアップ転職 (SEからプロダクトマネージャー)",
      career_context_summary: `システムインテグレーターでの${data.yearsOfExperience || '5年'}の開発経験。Java, Reactを用いたスクラムでの設計・実装から、顧客要件定義のリード経験を持つ。`,
      target_job_summary: `自社SaaS製品のプロダクトマネージャー(PM)。市場調査、プロダクトバックログの管理、エンジニア/デザイナーとの協調によるプロダクト価値の最大化。`,
      summary: "技術的な背景（仕様設計、開発フローの深い理解）はプロダクトマネージャーとして非常に大きな強み（即戦力）です。これに加えて「顧客課題のビジネス要求定義」や「チームのファシリテーション能力」を前面に出し、単なるエンジニアリング要員ではなく、ビジネス価値を最大化できるPM候補として演出します。",
      matched_points: [
        "開発プロセス・技術スタックへの深い造詣",
        "顧客要件の定義から設計への落とし込み経験",
        "スクラムなどの俊敏な開発プロセスの経験"
      ],
      transferable_skills: [
        "要件定義・プロダクト仕様策定力 (技術とビジネスの橋渡し)",
        "アジャイル・スクラム開発マネジメント",
        "論理的思考力とドキュメンテーション能力"
      ],
      weak_points: [
        "ビジネス成果（売上・LTV・Churn等）の管理やマーケティング経験の不足",
        "プロダクトロードマップの戦略的ロードマップ策定プロセスの経験不足"
      ],
      missing_information: [
        "これまで関わったシステムの規模（例：ユーザー数や予算規模など）",
        "製品開発においてUI/UXデザイナーと協働した経験の有無"
      ],
      recommended_keywords: ["プロダクトバックログ", "要件定義", "アジャイル開発", "ステークホルダー調整", "仕様策定", "即戦力"],
      rewrite_strategy: "『仕様書通りに開発した』という受け身の表現から、『開発チームをリードし、顧客の真のニーズを動くシステムとして具現化した』というPM的リーダーシップを強調する形に修正しました。",
      rewrite_suggestions: [
        "技術名だけでなく、そのシステムを導入した結果、顧客の『どのようなビジネス効果（コスト削減、売上向上）』に貢献できたかも記載すると完璧です。"
      ],
      improved_sections: {
        self_pr: `【自己PR：技術理解に基づく仕様策定とプロダクト開発推進】
これまで5年間、Webエンジニアとして設計から開発までを一貫して担当し、特に直近2年はクライアントとの要件定義や仕様調整といった上流工程をリードしてまいりました。
開発チームのベロシティと実装フィジビリティを正確に把握した上で、最適な製品仕様に落とし込むことができるため、エンジニアとビジネスサイド双方と円滑に合意形成を行い、開発ロスを最小限に抑えることができます。`,
        motivation: `【志望動機】
クライアント向けシステムの受託開発を通じて培った技術力をベースに、自社プロダクトのライフサイクル全般に関わり、長期的に顧客価値を最大化させたいと考え、貴社のプロダクトマネージャー職を志望いたします。
貴社プロダクトの開発ロードマップとビジネス戦略を理解し、開発チームと共通の言語で会話しつつ、不要な仕様を省いて最も価値の高い機能をスピーディにリリースできるPMとして、組織に即戦力で貢献します。`,
        career_summary: `Java、Reactを中心としたWebシステムの設計・開発および要件定義。アジャイルスクラムでの開発リードや、他部署との機能要件調整を担当。`,
        work_experience: `■Webシステム開発・要件定義業務
・クライアントのビジネス要件をシステム仕様（ユースケース、画面設計、API設計）へ翻訳
・スクラムマスターとしてのスプリントプランニング運営、ベロシティ改善
・基幹システム刷新におけるアーキテクチャ選定および設計品質の標準化
【成果】新規ECプラットフォーム構築プロジェクトを予定納期通りに完了。開発チームのバグ手戻り率を前年比20%削減`,
        student_experience: `大学時代の情報理工学部にて、研究活動の傍ら複数のハッカソンに参加し、プロダクトのアイデア出しとプロトタイピングを担当。`,
        skills: `【技術・スキル】
・言語: Java, JavaScript (React, Node.js), Python, SQL
・ツール: Jira, Confluence, GitHub, Figma, AWS
・資格: 応用情報技術者 / 認定スクラムマスター(CSM)`
      },
      before_after: [
        {
          before: "仕様書に沿ってJavaとReactでプログラムを書きました。メンバーの進捗も見ていました。",
          after: "アジャイルスクラム開発において仕様調整とプロダクトバックログの優先順位付けを担当し、開発の手戻りを20%削減。エンジニアの生産性向上に貢献しました。",
          reason: "ただ指示に従ってコードを書いたのではなく、プロダクト開発プロセスの改善や仕様決定に関与した実績をアピールし、PMへの適性を示しました。"
        }
      ]
    };
  }

  // Generative default fallback that customizes output dynamically based on users fields
  return {
    score: 80,
    candidate_type: isNewGrad ? "新卒 / ポテンシャル採用" : "中途転職・キャリアチェンジ",
    career_context_summary: `${data.currentIndustry || '現業界'}における『${current}』としての実務経験。${data.yearsOfExperience ? data.yearsOfExperience + 'の' : ''}経験を有し、日常業務の実行と課題への取り組みを行っている。`,
    target_job_summary: `${data.targetIndustry || '目標業界'}における『${target}』職。求められる役割に対して、既存スキルの転移と行動プロセスの再現性が重視される。`,
    summary: `${current}としての業務プロセスに潜む「課題発見」「業務効率化」「関係者調整」などの汎用能力は、${target}職の求める人物像と多くの共通点があります。これらをビジネス言語に翻訳してアピールします。`,
    matched_points: [
      `${current}でのコミュニケーション経験と柔軟な対応力`,
      "業務上の課題に対して主体的に改善を模索したプロセス",
      `${data.toolsSkills || '使用ツール・スキル'}の親和性`
    ],
    transferable_skills: [
      "セルフマネジメント力 (目標への計画的なアプローチ)",
      "顧客思考/現場視点 (ユーザーの心理や痛みを理解する力)",
      "協調・調整スキル (円滑なコミュニケーション)"
    ],
    weak_points: [
      `目標職種（${target}）特有の実務知識や専門ルールの獲得`,
      "業務経験の差を埋めるための自律的な事前インプット"
    ],
    missing_information: [
      "直近のプロジェクトや日常業務で達成した『具体的な成果や数字』",
      "業務プロセスの改善において、自身が『工夫したポイント』"
    ],
    recommended_keywords: ["課題解決", "再現性", "目標コミット", "ポータブルスキル", "自律的学習"],
    rewrite_strategy: "既存の職種特有の言葉をかみ砕き、別の業界や職種でも十分活用可能な「課題解決力」や「主体的な業務改善姿勢」を強調した表現に書き換えました。",
    rewrite_suggestions: [
      "具体的な数値を1つでも追加すると説得力が増します（例: 作業時間を1時間短縮した、顧客アンケートで高評価を得たなど）。"
    ],
    improved_sections: {
      self_pr: `【自己PR：主体的な課題解決と業務効率化への貢献】
私の強みは、日々の業務における課題を放置せず、実行可能な改善策を見出して行動に移せる点です。これまで『${current}』の実務において、${data.keyTasks || '業務'}を担当する中で、非効率であったプロセスを整理し改善を図ってきました。
この「課題を発見し改善する力」は、目標とする『${target}』職の現場においても、組織の課題や顧客ニーズを正確に捉え、積極的に貢献を形にする過程で再現できると確信しております。`,
      motivation: `【志望動機】
これまでの『${current}』としての経験を通じて培ったコミュニケーション力と課題解決力をベースに、より自身の可能性を広げ貢献度の高い分野に挑戦したいと考え、貴社の『${target}』職を志望いたします。
未経験の領域であっても、持ち前の高い知的好奇心と学習意欲を発揮し、必要な専門知識や業界知識を主体的にキャッチアップしてまいります。即戦力として期待されるポータブルスキルを発揮し、早期にチームの戦力となるよう尽力します。`,
      career_summary: `『${current}』としての実務に従事。日常業務の遂行とともに、業務フローの見直しやチーム連携の向上に取り組み貢献。`,
      work_experience: `■${current}業務および店舗・オフィス運営業務
・日々の『${data.keyTasks || '実務'}』の円滑な遂行と品質管理
・${data.achievements || '実績・業務における改善の取り組み'}の推進
・${data.toolsSkills || '使用ツールツール'}を用いたデータ整理・共有の仕組みづくり
【成果】業務フローの最適化に取り組み、日次の進捗管理の効率化およびチーム内ミスの低減に貢献。`,
      student_experience: `学生時代には、周囲と協調しながら課題をやり遂げる「課題解決のための行動力」を身につけました。`,
      skills: `【スキル・資格】
・業務管理・スケジュール調整能力
・主要スキル: ${data.toolsSkills || '業務プロセスに沿ったツール使用'}
・コミュニケーション・交渉力`
    },
    before_after: [
      {
        before: data.originalSelfPr || "元気に接客や事務作業をこなしていました。",
        after: `業務における課題解決意識を重視し、日々の「${data.keyTasks || '事務・接客業務'}」を計画的かつ円滑に推進。チーム全体の効率化に貢献しました。`,
        reason: "抽象的だったアピール内容を、職務を遂行する上での「計画性」や「課題解決意識」という汎用的ビジネススキルへと具体化しました。"
      }
    ]
  };
}

// Interacts with the Gemini API to execute the actual analysis
export async function analyzeResume(data: BackgroundData, settings: AppSettings): Promise<AIResponse> {
  if (settings.useMockMode || !settings.apiKey) {
    // Artificial latency for highly realistic simulated loading screen
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return generateMockResponse(data);
  }

  const modelName = settings.model || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${settings.apiKey}`;

  const prompt = buildUserPrompt(data);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: SYSTEM_PROMPT + "\n\n" + prompt
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
    }

    const resJson = await response.json();
    const responseText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error('Empty response from Gemini API');
    }

    // Parse the output as JSON
    const aiOutput: AIResponse = JSON.parse(responseText.trim());
    return aiOutput;
  } catch (error) {
    console.error('Error contacting Gemini API, falling back to customized Mock Mode', error);
    // Standard robust fallback in case of failure, giving the user a great experience anyway
    return generateMockResponse(data);
  }
}

export function generateMockResponse(data: BackgroundData): AIResponse {
  const raw = getRawMockResponse(data);
  return localizeMockResponse(raw, data.resumeLang);
}

// Substantial translation dictionary for high-fidelity Mock Mode translations
const MOCK_TRANSLATION_DICT: Record<string, { en: string; zh: string }> = {
  // Scenario 1: Retail to IT Sales
  "異業界・異職種転職 (店舗販売からIT営業)": {
    en: "Cross-Industry/Role Career Switch (Retail to IT Sales)",
    zh: "跨行业/职能跳槽 (店面销售转IT销售)"
  },
  "アパレル・小売業界での3年の店舗販売経験。接客による顧客ニーズのヒアリング能力と、店舗売上目標の達成に向けた販売計画の立案・実行力を有する。": {
    en: "3 years of store sales experience in the apparel/retail industry. Possesses strong customer needs elicitation skills and the ability to formulate and execute sales plans to achieve targets.",
    zh: "在服装/零售行业拥有3年店面销售经验。具备通过接客倾听客户需求的能力，以及为达成销售目标而制定和执行销售计划的行动力。"
  },
  "IT・SaaS業界における法人営業職。顧客企業の業務課題を抽出し、自社ITソリューションによる解決提案を行う役割。高いコミュニケーション能力と論理的提案力が求められる。": {
    en: "B2B sales role in the IT/SaaS industry. Responsible for identifying corporate clients' business issues and proposing solutions. Requires strong communication and logical presentation skills.",
    zh: "IT/SaaS行业的B2B销售岗位。负责挖掘客户企业的业务痛点，并基于自家IT解决方案进行提案。要求具备优秀的沟通能力与逻辑提报能力。"
  },
  "直接のIT法人営業経験はありませんが、店舗接客で培った「顧客の潜在ニーズを引き出すヒアリング力」と「店舗数値の目標管理能力」は非常に親和性が高いです。これらを『提案型営業』および『目標達成への執着力』として再定義しアピールします。": {
    en: "Although lacking direct B2B IT sales experience, the active listening and goal-oriented management skills gained in retail have high synergy. We reframe these as consultative sales capabilities.",
    zh: "虽然没有直接的IT大客户销售经验，但在店面接客中培养的“挖掘客户潜在需求的倾听力”和“店面数据目标管理能力”具有极高的协同效应。我们将其重新定义为“提案型销售”与“达成目标的执行力”进行包装。"
  },
  "接客でのコミュニケーション能力（顧客対応・折衝力）": {
    en: "Communication skills in customer service (customer handling and negotiation)",
    zh: "客户服务沟通能力（客户应对与谈判）"
  },
  "店舗売上などの目標達成意識（数値へのこだわり）": {
    en: "Awareness of achieving targets such as store sales (commitment to figures)",
    zh: "店铺销售等目标达成意识（对数字的敏感度）"
  },
  "チーム内での新人教育・リーダーシップ経験": {
    en: "Experience in new staff training and leadership within the team",
    zh: "团队内新人培训与领导力经验"
  },
  "課題発見ヒアリング能力 (顧客の困りごとを捉える力)": {
    en: "Problem identification and active listening (understanding client pain points)",
    zh: "痛点挖掘与倾听能力 (捕捉客户真实困扰的能力)"
  },
  "目標達成思考 (PDCAサイクルによる改善提案)": {
    en: "Target-driven mindset (improvement proposals via PDCA cycle)",
    zh: "目标达成导向思考 (基于PDCA循环的改善提案)"
  },
  "プレゼンテーションスキル (商品の魅力・価値訴求)": {
    en: "Presentation skills (promoting product benefits & value propositions)",
    zh: "提报与宣讲技巧 (诉求产品的魅力与价值)"
  },
  "法人営業経験（BtoB商習慣の理解）の不足": {
    en: "Lack of corporate B2B sales experience and understanding of business practices",
    zh: "缺乏B2B法人销售经验与对商业习惯的理解"
  },
  "ITテクノロジーやシステム開発プロセスに関する基礎知識": {
    en: "Basic knowledge of IT technologies and software development life cycles",
    zh: "缺乏IT技术及软件开发流程的相关基础知识"
  },
  "店舗売上の前年比成長率などの具体的な数値（例：前年比120%など）": {
    en: "Specific metrics such as year-over-year store sales growth (e.g. +120% YoY)",
    zh: "店铺销售额的同比增长率等具体数值（例如：同比增长120%等）"
  },
  "店舗で使用していた売上管理ツールやPOSシステムの名称": {
    en: "Names of POS systems or sales management tools used at the store",
    zh: "店铺曾使用的销售管理工具或POS系统的名称"
  },
  "顧客ヒアリング": { en: "Customer Needs Discovery", zh: "客户痛点倾听" },
  "課題解決型提案": { en: "Consultative Proposing", zh: "问题解决型提案" },
  "PDCAサイクル": { en: "PDCA Cycle", zh: "PDCA循环" },
  "目標達成率": { en: "Target Attainment Rate", zh: "目标达成率" },
  "即戦力化": { en: "Fast Integration / Immediate Contribution", zh: "即战力化" },
  "店舗販売の『接客』を『課題ヒアリング』に、『販売実績』を『売上目標達成プロセス』と言い換え、BtoB営業でも再現可能な汎用スキルとして表現を最適化しました。": {
    en: "Reframed 'customer service' as 'needs discovery' and 'sales history' as 'target attainment process' to optimize transferable B2B capabilities.",
    zh: "将店面销售的“接客”改称为“痛点挖掘”，将“销售业绩”改称为“目标达成过程”，优化了可在B2B销售中复用的通用技能表现。"
  },
  "単に「服を売った」ではなく、「顧客の着用シーンの悩みを解消する提案を行い、セット率向上を図った」とプロセスを重視して記載してください。": {
    en: "Emphasize the process, such as 'proposed styling choices to resolve customers' lifestyle concerns, increasing average order value' rather than simply 'sold clothes'.",
    zh: "不要只写“卖出衣服”，而要重视过程地写明“针对顾客的穿搭场景烦恼进行解惑提案，并致力于提高连带率”。"
  },
  "IT知識について「現在、基本情報技術者の学習中」などの自己研鑽姿勢を追加するとポテンシャルが評価されやすくなります。": {
    en: "Highlighting self-study efforts like 'currently studying for IT certificates' will strengthen potential assessment.",
    zh: "关于IT知识，若追加“目前正在自学基本信息技术员”等自我钻研的态度，潜力将更容易获得评估。"
  },

  // Scenario 2: Teacher to HR
  "異業界転職 (教育から企業人事・採用)": {
    en: "Cross-Industry Career Switch (Education to HR/Recruiting)",
    zh: "跨行业跳槽 (教育培训转企业人事招聘)"
  },
  "英語教室での4年の講師および教室運営経験。受講生の目標設定やモチベーション管理、保護者とのリレーション構築力を有する。": {
    en: "4 years of teaching and branch operations experience at English schools. Skilled in student goal setting, motivation coaching, and building stakeholder relationships.",
    zh: "在英语培训学校拥有4年的讲师及分校运营经验。具备学员目标设定与动机管理能力，以及与家长的关系构建力。"
  },
  "事業会社での採用担当・育成担当。学生や求職者へのアプローチ、面談、入社後のオンボーディング支援。": {
    en: "Corporate recruiting and talent development roles. Managing candidate outreach, interviewing, and onboarding support.",
    zh: "企业内的招聘与培训担当。负责接触学生或求职者、面谈及入选后的入职培训支持。"
  },
  "教育現場における「個人の目標達成を支援するコミュニケーション能力」や「面談を通じた動機付けスキル」は、人事・採用における求職者アトラクトや社員育成プログラムと高いシナジーがあります。これを人事領域の専門用語に翻訳してアピールします。": {
    en: "The ability to support individual goals and coach motivation has high synergy with recruitment candidate attraction and employee development. We translate these to standard HR terminology.",
    zh: "在教育现场中锻炼出的“支持个人达成目标沟通能力”和“通过面谈的动机引导技巧”，与人事招聘中的吸引求职者及员工培训项目有着极高契合度。我们将此翻译为人事领域的专业术语予以展示。"
  },
  "個人の資質を見抜く・傾聴するヒアリング能力": {
    en: "Active listening and capability to identify individual talents",
    zh: "看透个人资质、倾听与挖掘的能力"
  },
  "受講継続を促すための動機付け（モチベーションマネジメント）": {
    en: "Coaching motivation to encourage program retention",
    zh: "促使持续学习的动机引导 (动机管理)"
  },
  "新規入会者を増やすための説明会運営などのプレゼンテーション": {
    en: "Presenting in information sessions to boost new memberships",
    zh: "为增加新入会者而运营说明会等宣讲能力"
  },
  "ファシリテーション＆プレゼンテーション能力": {
    en: "Facilitation & Presentation Skills",
    zh: "会议引导与宣讲呈现能力"
  },
  "モチベーション設計・心理的安全性構築": {
    en: "Motivation design and building psychological safety",
    zh: "动机引导设计与心理安全感构建"
  },
  "保護者対応によるマルチステークホルダー調整力": {
    en: "Multi-stakeholder negotiation via parent communications",
    zh: "通过应对家长培养的多方利益相关者协调力"
  },
  "企業における労務管理や法規制（労働基準法等）の知識不足": {
    en: "Lack of knowledge in corporate labor relations and employment regulations",
    zh: "缺乏企业内劳务管理及法律法规（如劳动基准法）的相关知识"
  },
  "中途・新卒採用の市場トレンドやチャネル選定（求人媒体、エージェント）の経験不足": {
    en: "Lack of experience in sourcing channels (job boards, agencies) and recruiting market trends",
    zh: "缺乏中途与应届生招聘市场趋势及渠道选择（招聘媒体、猎头）的经验"
  },
  "入会率・継続率などの担当教室の定量データ（例：退会率を5%以下に維持など）": {
    en: "Quantitative metrics of the school (e.g. maintaining dropout rate under 5%)",
    zh: "所负责分校的入会率、留存率等定量数据（例如：将退会率维持在5%以下等）"
  },
  "講師の管理・育成（シフト調整、授業指導）などのマネジメント経験の有無": {
    en: "Presence of management experience such as instructor training and shift scheduling",
    zh: "是否具备讲师的管理与培训（排班调整、授课指导）等管理经验"
  },
  "モチベーションマネジメント": { en: "Motivation Management", zh: "动机管理" },
  "アトラクト": { en: "Candidate Attraction", zh: "求职者吸引" },
  "面談・カウンセリング": { en: "Interviewing / Counseling", zh: "面谈与职业咨询" },
  "母集団形成": { en: "Talent Pool Sourcing", zh: "人才库建设" },
  "関係構築": { en: "Relationship Building", zh: "信任关系构建" },
  "『教える・教育する』という表現から『対象者の特性に合わせたコミュニケーション・伴走支援』へと抽象度を上げ、企業における『採用候補者のアトラクト』『社員のオンボーディング・エンゲージメント向上』に役立つポータブルスキルとして記述を整えました。": {
    en: "Abstracted 'teaching' into 'tailored communication and coaching' to map directly onto 'candidate attraction' and 'onboarding and employee engagement'.",
    zh: "将“教导/教育”的表现升华至“配合对象特性的沟通与伴走式支持”，整理为企业内“吸引求职者”和“员工融入与敬业度提升”的通用能力表现。"
  },
  "生徒だけでなく、その背後にいる「保護者」との折衝経験を『多様な関係者との調整力』として記述すると、ビジネスシーンでの信頼感が増します。": {
    en: "Reframing negotiation with parents as 'multi-stakeholder management' adds business credibility.",
    zh: "若将与学生以及背后的“家长”的谈判经验描述为“多方利益相关者协调力”，将增加在商业场景中的信赖感。"
  },

  // Scenario 3: SE to PM
  "同職種・キャリアアップ転職 (SEからプロダクトマネージャー)": {
    en: "Same Field Career Advancement (SE to Product Manager)",
    zh: "同职能职业晋升 (软件工程师转产品经理)"
  },
  "システムインテグレーターでの5年の開発経験。Java, Reactを用いたスクラムでの設計・実装から、顧客要件定義の調整": {
    en: "5 years of system integration development experience. Skilled in Java/React scrum implementation and customer requirements elicitation.",
    zh: "在系统集成商（SIer）拥有5年开发经验。具备使用Java和React在敏捷团队中的设计与实现、以及协调客户需求定义的能力。"
  },
  "自社SaaS製品のプロダクトマネージャー(PM)。市場調査、プロダクトバックログの管理、エンジニア/デザイナーとの協調によるプロダクト価値の最大化。": {
    en: "Product Manager (PM) for proprietary SaaS products. Managing roadmaps, product backlogs, and coordinating with designers/engineers to maximize product value.",
    zh: "自研SaaS产品经理(PM)。通过市场调研、产品积压管理、以及与工程师/设计师的协同，实现产品价值的最大化。"
  },
  "技術的な背景（仕様設計、開発フローの深い理解）はプロダクトマネージャーとして非常に大きな強み（即戦力）です。これに加えて「顧客課題のビジネス要求定義」や「チームのファシリテーション能力」を前面に出し、単なるエンジニアリング要員ではなく、ビジネス価値を最大化できるPM候補として演出します。": {
    en: "A technical background (deep understanding of specs and flows) is a huge asset for PM. We highlight customer-facing business requirement writing and team leadership.",
    zh: "技术背景（对规格设计、开发流程的深度理解）作为产品经理是极大的强项（即战力）。在此基础上，我们将“客户课题的业务需求定义”和“团队引导能力”推向前端，将其包装为能够最大化商业价值的PM候选人，而非单纯的技术开发人员。"
  },
  "開発プロセス・技術スタックへの深い造詣": {
    en: "Deep understanding of development processes and tech stacks",
    zh: "对开发流程与技术栈的深厚造诣"
  },
  "顧客要件の定義から設計への落とし込み経験": {
    en: "Experience translating client requirements into architectural designs",
    zh: "将客户需求定义细化落实在设计中的经验"
  },
  "スクラムなどの俊敏な開発プロセスの経験": {
    en: "Experience with agile development methodologies such as Scrum",
    zh: "敏捷/Scrum等高效开发流程的经验"
  },
  "要件定義・プロダクト仕様策定力 (技術とビジネスの橋渡し)": {
    en: "Requirement writing & Product specification definition (bridging engineering & business)",
    zh: "需求定义与产品规格制定力 (技术与业务的桥梁)"
  },
  "アジャイル・スクラム開発マネジメント": {
    en: "Agile/Scrum development management",
    zh: "敏捷与Scrum开发管理"
  },
  "論理的思考力とドキュメンテーション能力": {
    en: "Logical thinking and structured documentation skills",
    zh: "逻辑思维力与文档撰写能力"
  },
  "ビジネス成果（売上・LTV・Churn等）の管理やマーケティング経験の不足": {
    en: "Lack of experience in managing business metrics (revenue, LTV, churn) and marketing",
    zh: "缺乏商业结果（销售额、LTV、流失率等）管理及市场推广的经验"
  },
  "プロダクトロードマップの戦略的ロードマップ策定プロセスの経験不足": {
    en: "Lack of experience in establishing strategic long-term product roadmaps",
    zh: "缺乏制定战略性产品路线图流程的经验"
  },
  "これまで関わったシステムの規模（例：ユーザー数や予算規模など）": {
    en: "Scale of projects involved in (e.g. number of users, budget sizes)",
    zh: "曾参与系统的规模（例如：用户数或预算规模等）"
  },
  "製品開発においてUI/UXデザイナーと協働した経験の有無": {
    en: "Presence of collaboration experience with UI/UX designers in product builds",
    zh: "在产品开发中是否具备与UI/UX设计师协同合作的经验"
  },
  "プロダクトバックログ": { en: "Product Backlog", zh: "产品积压 (Backlog)" },
  "要件定義": { en: "Requirements Definition", zh: "需求定义" },
  "アジャイル開発": { en: "Agile Development", zh: "敏捷开发" },
  "ステークホルダー調整": { en: "Stakeholder Alignment", zh: "利益相关者协调" },
  "仕様策定": { en: "Specification Writing", zh: "规格制定" },
  "『仕様書通りに開発した』という受け身の表現から、『開発チームをリードし、顧客の真のニーズを動くシステムとして具現化した』というPM的リーダーシップを強調する形に修正しました。": {
    en: "Shifted passive 'developed according to specs' into proactive PM leadership: 'led the dev team to turn client needs into functional features'.",
    zh: "将“按照规格说明书进行开发”的被动描述，修改为强调PM式领导力的“引领开发团队，将客户的真实需求具现化为实际运行的系统”。"
  },
  "技術名だけでなく、そのシステムを導入した結果、顧客の『どのようなビジネス効果（コスト削減、売上向上）』に貢献できたかも記載すると完璧です。": {
    en: "It would be perfect to add the business outcomes (cost cuts, revenue lift) that clients achieved via your system.",
    zh: "若能不仅写明技术名称，还写出导入该系统后为客户贡献了“怎样的商业效果（降低成本、提升销售额等）”，将更加完美。"
  }
};

// Localizes the mock response based on target language
function localizeMockResponse(resp: AIResponse, lang: string): AIResponse {
  if (lang === 'ja') return resp;
  
  const isEn = lang === 'en';
  const isZh = lang === 'zh';
  const isBilingual = lang === 'bilingual';

  // Deep clone
  const localized: AIResponse = JSON.parse(JSON.stringify(resp));

  const translate = (txt: string): string => {
    if (!txt) return txt;
    const match = MOCK_TRANSLATION_DICT[txt.trim()];
    if (match) {
      return isEn ? match.en : isZh ? match.zh : `${match.zh}\n(${match.en})`;
    }
    
    // Fallback replacements for customized text
    let temp = txt;
    if (isEn) {
      temp = temp.replace(/成果/g, "Achievements").replace(/経験/g, "Experience").replace(/能力/g, "Capability").replace(/目標/g, "Target").replace(/接客/g, "Customer service").replace(/業務/g, "Tasks");
    } else if (isZh || isBilingual) {
      temp = temp.replace(/自己PR/g, "个人优势/自我介绍").replace(/志望動機/g, "求职意向/动机").replace(/職務経歴/g, "工作经历").replace(/成果/g, "成果").replace(/経験/g, "经验").replace(/能力/g, "能力").replace(/目標/g, "目标").replace(/接客/g, "接客").replace(/業務/g, "业务");
    }
    return temp;
  };

  // Translate meta
  localized.candidate_type = translate(localized.candidate_type);
  localized.career_context_summary = translate(localized.career_context_summary);
  localized.target_job_summary = translate(localized.target_job_summary);
  localized.summary = translate(localized.summary);
  localized.rewrite_strategy = translate(localized.rewrite_strategy);

  localized.matched_points = localized.matched_points.map(translate);
  localized.transferable_skills = localized.transferable_skills.map(translate);
  localized.weak_points = localized.weak_points.map(translate);
  localized.missing_information = localized.missing_information.map(translate);
  localized.recommended_keywords = localized.recommended_keywords.map(translate);
  localized.rewrite_suggestions = localized.rewrite_suggestions.map(translate);

  // Translate before/after list
  localized.before_after = localized.before_after.map(item => ({
    before: translate(item.before),
    after: translate(item.after),
    reason: translate(item.reason)
  }));

  // Translate improved sections (Providing high quality EN/ZH equivalents for the presets)
  // Check retail to IT
  const isRetail = resp.career_context_summary.includes('アパレル');
  const isTeacher = resp.career_context_summary.includes('英語教室');
  const isSE = resp.career_context_summary.includes('システムインテグレーター');

  if (isRetail) {
    if (isEn) {
      localized.improved_sections = {
        self_pr: `[Self-PR: Needs-based consultative sales and goal commitment]
In store sales, I did not just describe garments but practiced "consultative needs discovery" to understand client wear cases and lifestyles. This boosted average transaction value by 15% and achieved store targets.
This capability translates directly to analyzing business clients' challenges and presenting appropriate SaaS products.`,
        motivation: `[Motivation]
While retail customer support was rewarding, I want to support operations and business growth at a corporate level, which led me to B2B IT sales.
Your Shift & Sales Management SaaS directly solves the manual scheduling inefficiencies I faced in retail. I wish to leverage my customer needs discovery and target achievement mindset to contribute to clients' DX journey.`,
        career_summary: "Apparel store customer sales and operations. Realized top sales performance through custom style matching and led junior staff training.",
        work_experience: `■ Retail Operations and Store Sales
- Conducted consultative needs-based customer sales to boost order value.
- Analyzed POS data to adjust product layouts and optimize store inventories.
- Trained 3 new part-time team members and optimized training sheets.
[Results] Monthly personal sales peak of 3.2M JPY (115% target attainment). Awarded Excellent Staff in store satisfaction program.`,
        student_experience: "Shift manager at restaurant in college. Created operations handbook that increased guest seat rotation rate by 10%.",
        skills: `[Skills]
- Consultative Sales & active listening
- Goal-oriented metrics management (sales, stock)
- Tools: MS Excel, PowerPoint, Instagram Business API, Zoom
- Credentials: Sales Representative Level 2 / IT Passport (studying)`
      };
    } else {
      // Chinese or Bilingual
      localized.improved_sections = {
        self_pr: `【自我介绍：精准挖掘客户需求与结果导向的执行力】
在服装店面销售中，我不仅进行单向的商品介绍，更彻底贴近客户的穿搭场景与生活方式进行“痛点挖掘式倾听”。结果使平均客单价提升了15%，为达成店铺销售目标做出了贡献。
这种“挖掘需求并提案价值”的能力，能直接复用到IT销售中分析企业客户课题、提案并导入合适SaaS系统的流程中。`,
        motivation: `【求职意向】
通过店面销售的经验，我在直接帮助客户中找到了价值，同时也希望从企业根本上帮助其提升业务效率和业务增长，因此志向投身大客户IT销售。
贵司的业务效率提升SaaS正是我在前职店铺管理中感到痛点的“排班与销售管理”痛点的优秀方案。我希望发挥店面培养的“倾听力”与“目标达成执行力”，为客户企业的数字化转型（DX）做出贡献。`,
        career_summary: "服装店面销售与运营协助。通过针对性的搭配提案达成个人销售额店铺No.1，并负责新人培训指导。",
        work_experience: `■ 店铺运营与销售业务
・针对顾客痛点的咨询式提案销售（客单价提升企划）
・基于销售数据分析变更陈列位置，执行库存适正化管理
・培训3名新人兼职人员，整备相关培训手册
【成果】个人单月销售额最高达320万日元（达成率115%），并在店铺满意度评选中被选为优秀员工。`,
        student_experience: "大学期间担任餐厅兼职组长，负责排班及流程改善。制作了新进指南使餐桌周转率提升10%。",
        skills: `【专业技能】
・痛点挖掘型销售与沟通能力
・指标目标管理（销售额、库存）
・常用工具: MS Excel, PowerPoint, Instagram 分析工具, Zoom
・证书: 销售士2级 / IT Passport (自学中，计划2026年9月报考)`
      };
    }
  } else if (isTeacher) {
    if (isEn) {
      localized.improved_sections = {
        self_pr: `[Self-PR: Collaborative counseling and needs-based relationship building]
Coached over 100 students and parents annually, building custom learning programs to match their specific milestones. This active listening and collaborative support translates directly to guiding job candidates and onboarding employees.`,
        motivation: `[Motivation]
Supporting students' growth made me passionate about helping individuals find the right place to thrive. I wish to transition into corporate recruitment. Your commitment to employee career paths aligns with my values. I want to apply my presentation skills to info-sessions and my coaching skills to talent acquisition.`,
        career_summary: "Teaching and branch management at English school. Guided students' performance and boosted membership conversions through event operations.",
        work_experience: `■ English Branch Management & Teaching
- Taught weekly courses (25+ hours) and assessed students' progress.
- Organized counseling sessions with parents to secure annual contracts.
[Results] Achieved 96% student retention rate (company average 90%). Increased experience-to-membership conversion rate by 12% YoY.`,
        student_experience: "College club coordinator. Expanded welcome campaign attendance by 1.5x YoY.",
        skills: `[Skills]
- Group facilitation & public speaking
- Career coaching & active listening
- English (TOEIC 880, fluent) / Japanese (Native)
- G Suite, Slack, Notion`
      };
    } else {
      localized.improved_sections = {
        self_pr: `【自我介绍：伴走型沟通与基于课题分析的信任构建】
作为英语讲师，我每年面对约100名学员及其家长，根据每个人的学习痛点和动机波动制定并实施了个性化教学方案。
这种“倾听个人目标、解决课题并伴走支持”的能力，能在人事招聘中用于贴近求职者生涯规划、进行岗位匹配，以及入职后的关怀面谈中。`,
        motivation: `【求职意向】
在英语学校工作中，我深刻体会到“让合适的人在合适的平台发挥价值”的重要性，因此立志转型企业HR招聘。
贵司推行的多样化工作方式与主体性职业发展路径令我产生强烈共鸣。我希望将讲师时期锻炼的“宣讲呈现力”用于宣讲会，将“解决个别痛点的面谈力”用于求职者沟通，为人才招聘做出贡献。`,
        career_summary: "英对话学校的日常教学及分校运营。通过与家长定期沟通促成留存率提升，并策划体验课达成新签目标。",
        work_experience: `■ 英语学校教学与运营
・负责幼少儿至成人英语教学（每周约25节课）
・定期进行学习成果反馈及指导面谈
・策划并运营家长交流会及季节性活动
【成果】所带班级学员留存率96%（全公司平均90%），体验课当日签约率同比提升12%。`,
        student_experience: "大学期间担任社团迎新活动策划人，迎新人数同比提升1.5倍。",
        skills: `【专业技能】
・宣讲与会议引导（Facilitation）能力
・倾听、关怀与动机引导
・语言能力: 英语（TOEIC 880 / 商务交流水平）
・办公系统: Google Workspace, Slack, Notion`
      };
    }
  } else if (isSE) {
    if (isEn) {
      localized.improved_sections = {
        self_pr: `[Self-PR: Translating tech constraints into product specifications]
5 years of software engineering experience. I bridge business and tech by translating client requirements into actionable development roadmaps, maintaining development velocity while ensuring code quality.`,
        motivation: `[Motivation]
Transitioning from system integration to product management because I want to drive long-term product value. As a PM, my technical grounding will enable me to align with engineers immediately, eliminating development waste and driving fast feature releases.`,
        career_summary: "Requirements definition and development using Java and React. Led agile scrum development teams and managed stakeholder adjustments.",
        work_experience: `■ Software Engineering & Requirements Definition
- Translated corporate business flows into system specs (Jira backlogs, screen flows).
- Facilitated scrum planning, daily standups, and velocity management.
[Results] Delivered financial system migrations on budget and on schedule. Reduced bug rates by 20% YoY by clarifying early spec scopes.`,
        student_experience: "Participated in university hackathons as prototype team leader.",
        skills: `[Technical Skills]
- Stack: Java, Spring Boot, React, SQL, AWS
- Agile: Certified Scrum Product Owner / Scrum Master (CSM)
- Tools: Jira, Confluence, Github, Figma`
      };
    } else {
      localized.improved_sections = {
        self_pr: `【自我介绍：基于技术理解的需求制定与产品开发推进】
拥有5年软件工程师经验，负责从设计到开发的完整闭环。近2年作为Scrum Team Leader，主导与客户的业务需求对接与技术可行性分析。
由于我能准确评估开发团队的效率与实现可行性，因此能在业务端与开发端达成高效共识，将开发返工率降到最低。`,
        motivation: `【求职意向】
希望将自己在受托开发（SIer）中积累的技术实力作为支点，参与到自研产品的完整生命周期中，以PM身份长期创造客户价值。
我能理解贵司产品的路线图与商业战略，并能使用工程师的共同语言进行协作，省去不必要的规格冗余，迅速推出高价值功能。`,
        career_summary: "以Java、React为中心的Web系统设计、开发及需求定义。主导敏捷Scrum团队开发，并负责与其他业务部门的规格对接。",
        work_experience: `■ 软件开发与需求对接
・将客户商业要求转换为系统需求（用户故事、画面流及接口规范）
・担任Scrum Master，主导Sprint Planning及开发速度优化
・基幹系统重构中的架构选型与开发质量规范制定
【成果】按时并控制预算完成了EC平台重构项目，使团队开发返工率同比降低20%。`,
        student_experience: "大学期间参加多次黑客马拉松，主导产品想法构思及原型快速实现。",
        skills: `【技术与证书】
・语言/框架: Java, JavaScript (React, Node.js), SQL
・项目工具: Jira, Confluence, GitHub, Figma, AWS
・专业证书: 软件设计师 (对应应用情报) / 认证Scrum Master (CSM)`
      };
    }
  }

  return localized;
}

