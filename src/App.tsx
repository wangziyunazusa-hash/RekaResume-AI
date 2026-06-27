import React, { useState, useEffect } from 'react';
import type { BackgroundData, AIResponse, AppSettings, CandidateType } from './types';
import { analyzeResume } from './services/ai';

// Pre-configured templates to give the user a high-fidelity experience out of the box
const PRESETS: Record<CandidateType, Partial<BackgroundData>> = {
  new_grad: {
    currentOccupation: '大学生（文学部）',
    currentIndustry: '教育・サービス（アルバイト）',
    yearsOfExperience: '在学中（アルバイト2年）',
    keyTasks: 'カフェでの接客・販売、時間帯リーダーとしてシフト調整や発注業務を担当',
    achievements: '新人教育用マニュアルを作成し、研修期間を従来の2週間から1週間に短縮。顧客アンケートの満足度評価でエリア内トップを獲得。',
    toolsSkills: 'Excel (表計算・シフト表作成), PowerPoint (ゼミ発表用資料作成), コミュニケーション能力',
    targetOccupation: 'IT企業・ソリューション法人営業',
    targetIndustry: 'IT・SaaS・ソフトウェア',
    targetJd: '自社SaaSプロダクトの新規開拓および既存顧客への活用提案。顧客の課題ヒアリング、課題解決プランの策定、提案資料の作成、商談・クロージングを担当。主体性があり、自ら行動できる人物を求めています。',
    emphasizedSkills: '主体性、課題解決能力、目標達成へのプロセス',
    avoidContent: '自慢話のように聞こえる過度な表現',
    resumeLang: 'ja',
    toneStyle: 'enthusiastic',
    originalSelfPr: '大学時代はカフェのアルバイトを頑張りました。一生懸命接客をして、お客様に喜んでもらえるように笑顔で対応しました。新人指導も任されて、マニュアルを作ったらみんなの仕事が早くなりました。諦めないで最後までやり遂げる性格です。',
    originalMotivation: 'ITを使って社会を便利にしたいと思い志望しました。貴社のSaaSはカフェでも使われていて便利だったので、私もこのサービスを広めるお手伝いがしたいです。営業としてたくさん契約を取れるように頑張ります。',
    originalWorkExperience: '■大学時代のカフェアルバイト\n・コーヒーの提供と接客対応\n・売上レジ締め作業\n・新人の教育指導',
    originalStudentExperience: '大学のゼミでは近代文学を専攻し、30ページの卒業論文を執筆しました。',
    originalSkills: '資格：普通自動車第一種免許'
  },
  second_new_grad: {
    currentOccupation: 'アパレル店舗スタッフ（アパレル販売）',
    currentIndustry: '小売・ファッション',
    yearsOfExperience: '1年半',
    keyTasks: 'アパレル店舗での接客、売上管理、在庫管理、SNSを活用したコーディネート提案と新規集客の実施',
    achievements: '個人売上でエリア内トップ5に入り、SNSの投稿経由の来店者数を月間30組から120組に4倍増加させました。',
    toolsSkills: 'Instagram (分析ツール), LINE公式アカウント, POSシステム, Excel',
    targetOccupation: 'IT企業・カスタマーサクセス (CS)',
    targetIndustry: 'SaaS・Webサービス',
    targetJd: '自社システムをご利用の企業様へ、導入オンボーディング、活用提案、利用率向上のための勉強会開催、要望の社内フィードバック。解約率の低下とアップセルに貢献するポジションです。',
    emphasizedSkills: '顧客志向、データ分析に基づく改善提案、関係構築力',
    avoidContent: '前職の愚痴や、早期離職に対するネガティブな理由',
    resumeLang: 'ja',
    toneStyle: 'second_new_grad',
    originalSelfPr: 'アパレルで1年半、接客をしていました。お客様のコーディネート相談に乗ることが得意で、仲良くなってリピートしてくれるお客様が増えました。また、お店のInstagramを毎日更新して、お店に来てくれる人を増やしました。第二新卒ですがやる気はあります。',
    originalMotivation: '接客経験を活かして、店舗ではなく法人のお客様のサポートがしたいと思いCSを志望します。貴社のシステムは店舗でも使われており、もっと便利に使えるようにお客様に寄り添っていきたいです。新しいIT知識を早く覚えたいです。',
    originalWorkExperience: '■アパレル店舗販売スタッフ\n・接客、お会計、在庫出し\n・SNSコーディネート発信\n・ディスプレイ構成変更',
    originalStudentExperience: 'サークルでダンスチームに所属し、フェスティバルの構成を担当しました。',
    originalSkills: '販売士3級'
  },
  career_changer: {
    currentOccupation: '英会話スクール講師・教室長',
    currentIndustry: '教育・スクール運営',
    yearsOfExperience: '4年',
    keyTasks: '英会話レッスンの指導、生徒の学習進捗面談、保護者折衝、体験レッスンの案内による新規入会率向上、講師のマネジメント',
    achievements: '担当する教室の生徒継続率96％（前年比+5％）を達成。体験レッスンからの新規入会成約率を45％から60％へ引き上げました。',
    toolsSkills: 'カウンセリング面談、スピーキング指導、英語（ビジネスレベル）、Google Workspace, Slack',
    targetOccupation: '中途採用・人事コーディネーター',
    targetIndustry: '人材・IT・各種事業会社',
    targetJd: '採用部門のパートナーとして、母集団形成、エージェントコントロール、候補者へのアトラクト面談、選考プロセスの進行管理、内定者フォロー。関係者と滑らかに連携し、採用目標を達成する役割。',
    emphasizedSkills: 'コミュニケーション力、モチベーション管理、進捗管理',
    avoidContent: '教育業界の愚痴、講義スキルの過度なアピール',
    resumeLang: 'ja',
    toneStyle: 'professional',
    originalSelfPr: '英会話教室で講師とスクールリーダーをしていました。生徒さん一人ひとりのやる気を引き出す面談得意で、多くの生徒が途中で辞めずに継続してくれました。また、新しく入りたい人の面談も行い、スクールの売上目標達成に貢献しました。',
    originalMotivation: 'スクールで生徒さんのキャリアや勉強を支援する中で、もっと直接的に「企業と人をつなぐ仕事」に挑戦したいと感じ、人事を志望しました。講師として培ったアトラクト能力や調整力を活かして、会社の採用目標達成に貢献します。',
    originalWorkExperience: '■大手英会話スクール\n・英語指導およびカリキュラム調整\n・新規顧客開拓と入塾カウンセリング\n・非常勤講師4名のシフト管理とトレーニング',
    originalStudentExperience: '留学先の大学で日本人留学生会のイベント企画を担当し、100名規模のパーティーを成功させました。',
    originalSkills: 'TOEIC 880点、実用英語技能検定準1級'
  },
  cross_industry: {
    currentOccupation: '受託開発システムエンジニア (SE)',
    currentIndustry: 'IT・システムインテグレーター (SIer)',
    yearsOfExperience: '5年',
    keyTasks: '金融系業務システムの基本設計・詳細設計・実装・テスト、プロジェクトメンバーのタスク管理、顧客要件定義の調整',
    achievements: 'JavaとReactを用いた刷新プロジェクトにおいて、スクラムチームのリーダーとして仕様調整をリード。仕様漏れ手戻り率を前年比で20％削減。予算内でのオンタイム納品を達成。',
    toolsSkills: 'Java, React, SQL, GitHub, Jira, Confluence, アジャイル・スクラム開発',
    targetOccupation: '自社SaaS・プロダクトマネージャー (PM)',
    targetIndustry: 'IT・SaaSベンダー',
    targetJd: '自社SaaS製品のプロダクトロードマップ策定、プロダクトバックログの管理、UI/UXデザイナーおよびエンジニアとの仕様調整、顧客ヒアリングをベースにしたプロダクト価値の定義。',
    emphasizedSkills: 'エンジニアとの橋渡し力、要件定義能力、プロダクト視点',
    avoidContent: 'ただ言われたコードを書くだけの受動的なアピール',
    resumeLang: 'ja',
    toneStyle: 'professional',
    originalSelfPr: 'SIerでエンジニアとして5年間働きました。設計からコード書きまで一通りできます。最近はチームのリーダーとして、お客様とどんなシステムにするかを話し合って決めたり、スケジュールに遅れが出ないようにメンバーの進捗管理もしました。仕様のミスを減らす工夫をしました。',
    originalMotivation: '受託開発ではなく、自分でサービスを企画して育てるプロダクトマネージャーになりたくて応募しました。エンジニアの気持ちや開発のプロセスがよく分かるので、開発チームとスムーズに連携して、価値ある製品を素早く作ることができます。',
    originalWorkExperience: '■SI会社（システム開発）\n・業務基幹システムの要件定義および詳細設計\n・Java/Spring Bootを用いたバックエンド実装\n・スクラムチームのリード、Jiraを用いたチケット管理',
    originalStudentExperience: '理系大学のロボット研究会にて、大会に向けたソフトウェア制御モジュールの開発を担当。',
    originalSkills: '応用情報技術者、認定スクラムマスター(CSM)'
  },
  undecided: {
    currentOccupation: '一般事務・営業事務',
    currentIndustry: '不動産・住宅',
    yearsOfExperience: '3年',
    keyTasks: '契約書類の作成、電話・メールによる顧客対応、営業数値の集計、営業チームのサポート業務、各種データ入力',
    achievements: '紙で行っていた契約書の稟議プロセスをクラウドサインへ移行することを提案・実務推進し、契約締結までの日数を平均7日から2日へ短縮。月間15時間の間接業務時間を削減しました。',
    toolsSkills: 'Excel (VLOOKUP, ピボットテーブル), Word, Googleスプレッドシート, クラウドサイン, Slack',
    targetOccupation: 'マーケティングプランナー',
    targetIndustry: '広告・Webサービス',
    targetJd: 'クライアント企業のマーケティング支援、または自社サービスのリード獲得戦略の立案・実行。データ分析を元にしたWeb広告・コンテンツ企画の立案、結果のレポーティング、業務効率化。',
    emphasizedSkills: 'データ分析力、課題発見・改善提案力、業務効率化',
    avoidContent: '言われた作業のみをこなす受動的な印象の表現',
    resumeLang: 'ja',
    toneStyle: 'concise',
    originalSelfPr: '事務職として3年働いています。細かい作業が得意で、書類のミスがないように丁寧に進めてきました。また、みんながやりやすいように業務プロセスのペーパーレス化を提案して、契約締結のスピードを上げました。データの集計や分析も得意です。',
    originalMotivation: '事務としてサポートするだけでなく、自分からアイデアを出して施策を企画し、顧客を増やすマーケティングの仕事に挑戦したいです。事務で培ったデータ集計能力や業務効率化の姿勢を活かして、マーケティング数値を追う業務で貢献します。',
    originalWorkExperience: '■不動産会社（営業事務）\n・重要事項説明书等の作成および発送\n・顧客データベースへの入力と管理\n・クラウドシステム導入による事務作業の効率化',
    originalStudentExperience: '学園祭の実行委員として、広報物のパンフレット制作やSNS告知の運用を担当。',
    originalSkills: 'MOS Excel Expert、日商簿記検定3級'
  }
};

const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  model: 'gemini-1.5-flash',
  useMockMode: true
};

const INITIAL_BACKGROUND: BackgroundData = {
  candidateType: 'second_new_grad',
  currentOccupation: '',
  currentIndustry: '',
  yearsOfExperience: '',
  keyTasks: '',
  achievements: '',
  toolsSkills: '',
  targetOccupation: '',
  targetIndustry: '',
  targetJd: '',
  emphasizedSkills: '',
  avoidContent: '',
  resumeLang: 'ja',
  toneStyle: 'professional',
  originalSelfPr: '',
  originalMotivation: '',
  originalWorkExperience: '',
  originalStudentExperience: '',
  originalSkills: ''
};

// UI localization strings
const UI_DICTIONARY = {
  ja: {
    app_title: "RekaResume AI",
    api_settings: "API設定",
    usage_language: "使用言語",
    demo_active: "デモモード運転中",
    real_active: "リアルAI稼働中",
    save_settings: "設定を適用する",
    cancel: "キャンセル",
    api_title: "Gemini API 接続設定",
    api_mode: "API 運転モード",
    api_mode_demo: "デモ・模擬モード (キー不要)",
    api_mode_real: "リアルAI添削 (APIキーが必要)",
    api_key_label: "Gemini API キー",
    api_key_desc: "APIキーはブラウザの LocalStorage に安全に保管されます。",
    model_label: "AI モデル選択",
    loading_title: "AIキャリアアドバイザーが分析中...",
    loading_desc: "あなたのこれまでの経験からポータブルスキルを抽出し、目標の求人にマッチした最適な表現へ書き換えています。しばらくお待ちください。",
    next: "次へ進む",
    prev: "前へ戻る",
    run_analysis: "分析＆履歴書添削を実行",
    wizard_title_0: "求職タイプの選択",
    wizard_desc_0: "現在の状況と目標に合わせて最適化します",
    wizard_title_1: "現在の職歴・経験",
    wizard_desc_1: "あなたが持っている強みや成果を引き出します",
    wizard_title_2: "目標の職種・業界",
    wizard_desc_2: "応募先が求めている即戦力要件を定義します",
    wizard_title_3: "履歴書原文の入力",
    wizard_desc_3: "現在の自己PRや経歴書テキストを貼り付けてください",
    wizard_title_4: "確認と生成",
    wizard_desc_4: "AIによる分析方針と添削条件を確認します",
    current_occ: "現在の職業・職種",
    current_ind: "所属業界",
    years_exp: "経験年数 / 年数",
    tools_skills: "使用しているツール・保有資格",
    key_tasks: "主な日常業務・タスク内容",
    achievements: "具体的な成果・数字・改善エピソード",
    target_occ: "目指す職業・職種",
    target_ind: "目指す業界",
    target_jd: "目標求人の仕事内容 / 募集要項 (JD)",
    appeal_skills: "特にアピールしたい能力",
    avoid_content: "履歴書に書きたくない・弱めたいこと",
    resume_lang: "添削文書の言語",
    resume_lang_label: "添削文書の言語",
    tone_style: "表現のトーン＆マナー",
    preset_indicator: "💡 テンプレート自動入力機能",
    preset_indicator_desc: "選択した求職タイプに応じたリアルな模擬データが各フォームに自動設定されます。",
    sidebar_title: "背景パラメーター",
    sidebar_candidate_type: "求職者の属性",
    re_analyze: "再分析・再生成する",
    back_to_wizard: "ウィザードへ戻る",
    tab_report: "① マッチング分析レポート",
    tab_diff: "② 表現Before/After",
    tab_editor: "③ 添削済み履歴書出力",
    score_label: "求人適合度評価",
    score_unit: "点",
    eval_title: "AIキャリアアドバイザー総評",
    current_strengths: "現在のキャリアの強み",
    target_requirements: "応募求人の要求スキル",
    transferable_skills: "移行可能なポータブルスキル",
    matching_points: "マッチングポイント",
    weaknesses: "懸念点・アピール不足部分",
    missing_info: "補足すべき情報 (情報不足)",
    recommended_keywords: "盛り込むべき推奨業界キーワード",
    strategy_title: "AI補正方針",
    editor_banner_desc: "こちらのテキストはエディタ内で編集できます。完成した文章をコピーして応募書類にご活用ください。",
    copy_all: "一括コピーする",
    section_self_pr: "自己PR (Self PR)",
    section_motivation: "志望動機 (Motivation)",
    section_career_summary: "職務要約 (Career Summary)",
    section_work_exp: "職務経歴 (Work Experience)",
    section_student_exp: "学生時代の経験・ガクチカ",
    section_skills: "スキル・資格 (Skills & Qualifications)",
    badge_improved: "添削済み",
    copy: "コピー",
    required_tag: "*"
  },
  en: {
    app_title: "RekaResume AI",
    api_settings: "API Settings",
    usage_language: "Language",
    demo_active: "Demo Mode Active",
    real_active: "Real AI Active",
    save_settings: "Apply Settings",
    cancel: "Cancel",
    api_title: "Gemini API Connection Settings",
    api_mode: "API Running Mode",
    api_mode_demo: "Demo Mode (No Key Needed)",
    api_mode_real: "Real AI Rewrite (API Key Needed)",
    api_key_label: "Gemini API Key",
    api_key_desc: "Key stored securely in browser LocalStorage.",
    model_label: "AI Model Selection",
    loading_title: "AI Career Consultant Analyzing...",
    loading_desc: "Extracting portable skills and mapping experiences onto target requirements. Please wait a moment.",
    next: "Next Step",
    prev: "Previous Step",
    run_analysis: "Analyze & Optimize Resume",
    wizard_title_0: "Select Candidate Type",
    wizard_desc_0: "Tailor the optimization context based on your career stage",
    wizard_title_1: "Current Role & Experience",
    wizard_desc_1: "Describe your responsibilities, metrics, and achievements",
    wizard_title_2: "Target Role & Requirements",
    wizard_desc_2: "Define the job description and keywords of your target role",
    wizard_title_3: "Original Resume Text",
    wizard_desc_3: "Paste your existing drafts for Self-PR or Job History",
    wizard_title_4: "Review & Generate",
    wizard_desc_4: "Confirm analysis strategies and tone styles",
    current_occ: "Current Occupation / Job Title",
    current_ind: "Current Industry",
    years_exp: "Years of Experience",
    tools_skills: "Tools Used / Key Certs",
    key_tasks: "Key Tasks & Responsibilities",
    achievements: "Key Achievements & Quantifiable Metrics",
    target_occ: "Target Occupation / Job Title",
    target_ind: "Target Industry",
    target_jd: "Target Job Description (JD)",
    appeal_skills: "Skills to Emphasize",
    avoid_content: "Content to Avoid / Soften",
    resume_lang: "Optimized Target Language",
    resume_lang_label: "Optimized Target Language",
    tone_style: "Tone and Style Manner",
    preset_indicator: "💡 Preset Template Auto-Fill",
    preset_indicator_desc: "Selecting a candidate type dynamically fills templates for immediate testing.",
    sidebar_title: "Context Variables",
    sidebar_candidate_type: "Candidate Career Type",
    re_analyze: "Re-Analyze & Re-Generate",
    back_to_wizard: "Back to Wizard",
    tab_report: "1. Suitability Report",
    tab_diff: "2. Expression Before/After",
    tab_editor: "3. Optimized Resume Copy",
    score_label: "Suitability Rating",
    score_unit: "%",
    eval_title: "AI Advisor Strategy Executive Summary",
    current_strengths: "Current Career Strengths",
    target_requirements: "Target Job Skill Demands",
    transferable_skills: "Transferable Portable Skills",
    matching_points: "Strategic Matches",
    weaknesses: "Identified Gaps & Weaknesses",
    missing_info: "Information Gaps (Missing Details)",
    recommended_keywords: "Recommended Sourcing Keywords",
    strategy_title: "AI Strategy Guidelines",
    editor_banner_desc: "You can edit these boxes directly. Click Copy to use them in your files.",
    copy_all: "Copy All Sections",
    section_self_pr: "Self-PR / Cover Pitch",
    section_motivation: "Motivation Statement",
    section_career_summary: "Brief Career Summary",
    section_work_exp: "Detailed Work History",
    section_student_exp: "Extracurriculars / Student Life",
    section_skills: "Skills & Qualifications",
    badge_improved: "Optimized",
    copy: "Copy",
    required_tag: "*"
  },
  zh: {
    app_title: "RekaResume AI 简历修改助手",
    api_settings: "API 设置",
    usage_language: "使用语言",
    demo_active: "演示模式运行中",
    real_active: "真实 AI 运行中",
    save_settings: "应用设置",
    cancel: "取消",
    api_title: "Gemini API 连接设置",
    api_mode: "运行模式",
    api_mode_demo: "演示模拟模式 (无需密钥)",
    api_mode_real: "真实 AI 添削 (需要 API 密钥)",
    api_key_label: "Gemini API 密钥",
    api_key_desc: "密钥安全存储于浏览器的 LocalStorage 中。",
    model_label: "AI 模型选择",
    loading_title: "AI 职业顾问正在进行匹配性分析与改写...",
    loading_desc: "正在从您的经历中抽取可迁移的可携带能力，并配合目标岗位 JD 转化为高含金量的话术。请稍候片刻。",
    next: "下一步",
    prev: "上一步",
    run_analysis: "执行简历分析与润色",
    wizard_title_0: "选择求职类型",
    wizard_desc_0: "配合您的求职背景阶段进行深度契合与话术优化",
    wizard_title_1: "当前职历与经验",
    wizard_desc_1: "挖掘您的当前优势、亮点职责以及数据化成果",
    wizard_title_2: "目标求职岗位",
    wizard_desc_2: "定义应聘岗位的工作职责、招聘要求与关键字",
    wizard_title_3: "简历原文输入",
    wizard_desc_3: "粘贴您现有的自我介绍、求职信或工作履历片段",
    wizard_title_4: "核对参数并生成",
    wizard_desc_4: "确认 AI 的改写策略、润色语言与语气基调",
    current_occ: "当前职业 / 岗位名称",
    current_ind: "所属行业",
    years_exp: "工作年限",
    tools_skills: "使用工具 / 专业技能",
    key_tasks: "日常核心工作职责 / 任务",
    achievements: "具体成果 / 量化数据 / 改善案例 (事实基础)",
    target_occ: "意向职业 / 岗位",
    target_ind: "意向行业",
    target_jd: "目标岗位招聘要求 (JD / 职责描述)",
    appeal_skills: "希望重点突出的核心能力",
    avoid_content: "希望弱化或避免写进简历的内容",
    resume_lang: "简历优化语言",
    resume_lang_label: "简历优化目标语言",
    tone_style: "简历语言语气与调性",
    preset_indicator: "💡 模板数据自动填充功能",
    preset_indicator_desc: "选择求职类型后，各表单将自动设置逼真的模拟背景，方便您立即测试体验。",
    sidebar_title: "背景核心参数",
    sidebar_candidate_type: "求职者属性",
    re_analyze: "重新执行分析润色",
    back_to_wizard: "返回向导界面",
    tab_report: "① 岗位匹配分析报告",
    tab_diff: "② 改写前后话术对比",
    tab_editor: "③ 优化后简历文书导出",
    score_label: "岗位契合度评分",
    score_unit: "分",
    eval_title: "AI 顾问总评与求职建议",
    current_strengths: "当前核心优势",
    target_requirements: "目标岗位关键胜任力要求",
    transferable_skills: "可迁移技能 (Portable Skills)",
    matching_points: "匹配亮点",
    weaknesses: "简历主要短板与竞争劣势",
    missing_info: "建议补充的信息 (信息不足之处)",
    recommended_keywords: "简历中建议涵盖的行业关键词",
    strategy_title: "AI 简历改写整体策略",
    editor_banner_desc: "您可以在下方框内直接修改和编辑简历文本，满意后点击复制即可使用。",
    copy_all: "一键复制所有内容",
    section_self_pr: "自我介绍 / 自己PR",
    section_motivation: "求职意向 / 志望動機",
    section_career_summary: "职业简短概述 / 経歴要約",
    section_work_exp: "核心工作经历 / 職務経歴",
    section_student_exp: "学生时代活动 / 社会实践",
    section_skills: "技能与证书列表 / 資格・スキル",
    badge_improved: "优化后",
    copy: "复制",
    required_tag: "*"
  }
};

export default function App() {
  // UI Language state
  const [uiLang, setUiLang] = useState<'ja' | 'en' | 'zh'>('zh');

  // App States
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  const [backgroundData, setBackgroundData] = useState<BackgroundData>({
    ...INITIAL_BACKGROUND,
    ...PRESETS['second_new_grad'] // Default initial preset
  });
  
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AIResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'report' | 'diff' | 'editor'>('report');
  
  // Edited output state for direct modification
  const [editedSections, setEditedSections] = useState<AIResponse['improved_sections'] | null>(null);
  
  // Floating Toast State
  const [toastMessage, setToastMessage] = useState<string>('');

  // Load API keys from LocalStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('reka_gemini_api_key');
    const savedModel = localStorage.getItem('reka_gemini_model') || 'gemini-1.5-flash';
    const savedMockMode = localStorage.getItem('reka_use_mock_mode') !== 'false'; // default true
    const savedUiLang = localStorage.getItem('reka_ui_language');
    if (savedUiLang === 'ja' || savedUiLang === 'en' || savedUiLang === 'zh') {
      setUiLang(savedUiLang);
    }
    
    setSettings({
      apiKey: savedKey || '',
      model: savedModel,
      useMockMode: savedKey ? savedMockMode : true
    });
  }, []);

  const saveSettings = (newSettings: AppSettings) => {
    localStorage.setItem('reka_gemini_api_key', newSettings.apiKey);
    localStorage.setItem('reka_gemini_model', newSettings.model);
    localStorage.setItem('reka_use_mock_mode', String(newSettings.useMockMode));
    setSettings(newSettings);
    setIsSettingsOpen(false);
    showToast(uiLang === 'ja' ? '設定を保存しました' : uiLang === 'en' ? 'Settings saved' : '设置已保存');
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleUiLanguageChange = (lang: 'ja' | 'en' | 'zh') => {
    setUiLang(lang);
    localStorage.setItem('reka_ui_language', lang);
    setBackgroundData(prev => ({
      ...prev,
      resumeLang: lang
    }));
    showToast(lang === 'ja' ? '使用言語を日本語に切り替えました' : lang === 'en' ? 'Usage language switched to English' : '使用语言已切换为中文');
  };

  const handlePresetSelect = (type: CandidateType) => {
    const preset = PRESETS[type];
    setBackgroundData({
      ...INITIAL_BACKGROUND,
      candidateType: type,
      ...preset
    });
    
    const label = typeToLabel(type);
    showToast(uiLang === 'ja' ? `${label}のテンプレートを読み込みました` : uiLang === 'en' ? `Loaded ${label} template` : `已加载 ${label} 模板`);
  };

  const handleInputChange = (field: keyof BackgroundData, value: string) => {
    setBackgroundData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTriggerAnalysis = async () => {
    setIsLoading(true);
    try {
      const response = await analyzeResume(backgroundData, settings);
      setAnalysisResult(response);
      setEditedSections(response.improved_sections);
      setIsOnboarded(true);
      setActiveTab('report');
      showToast(uiLang === 'ja' ? '添削が完了しました！' : uiLang === 'en' ? 'Rewrite completed!' : '润色完成！');
    } catch (err) {
      console.error(err);
      showToast(uiLang === 'ja' ? '分析中にエラーが発生しました' : uiLang === 'en' ? 'Analysis failed' : '分析出现错误');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string, sectionName: string) => {
    navigator.clipboard.writeText(text);
    showToast(uiLang === 'ja' ? `${sectionName}をコピーしました` : uiLang === 'en' ? `Copied ${sectionName}` : `已复制 ${sectionName}`);
  };

  const typeToLabel = (type: CandidateType) => {
    if (uiLang === 'en') {
      switch(type) {
        case 'new_grad': return 'New Graduate';
        case 'second_new_grad': return 'Second New Graduate';
        case 'career_changer': return 'Same Field Changer';
        case 'cross_industry': return 'Cross Field Changer';
        case 'undecided': return 'Undecided / Career Switch';
      }
    }
    if (uiLang === 'zh') {
      switch(type) {
        case 'new_grad': return '应届毕业生';
        case 'second_new_grad': return '第二新卒 (工作三年内)';
        case 'career_changer': return '同职能跳槽 (晋升)';
        case 'cross_industry': return '跨行业/职能跳槽';
        case 'undecided': return '未确定/转型';
      }
    }
    switch(type) {
      case 'new_grad': return '新卒採用';
      case 'second_new_grad': return '第二新卒';
      case 'career_changer': return '同職種転職（キャリアアップ）';
      case 'cross_industry': return '異業界・異職種転職';
      case 'undecided': return '未定・キャリアチェンジ';
    }
  };

  // Localized UI dictionary shorthand
  const txt = UI_DICTIONARY[uiLang];

  // Steps definitions
  const steps = [
    { title: txt.wizard_title_0, desc: txt.wizard_desc_0 },
    { title: txt.wizard_title_1, desc: txt.wizard_desc_1 },
    { title: txt.wizard_title_2, desc: txt.wizard_desc_2 },
    { title: txt.wizard_title_3, desc: txt.wizard_desc_3 },
    { title: txt.wizard_title_4, desc: txt.wizard_desc_4 }
  ];

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-msg">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-icon">R</div>
          <div className="logo-text">{txt.app_title}</div>
          <div className="logo-badge">MVP</div>
        </div>
        
        <div className="header-actions">
          {/* Interface Language Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginRight: '1rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.2rem 0.25rem 0.2rem 0.55rem', borderRadius: '0.35rem', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{txt.usage_language}</span>
            {(['zh', 'en', 'ja'] as const).map((lang) => (
              <button 
                key={lang}
                className="btn btn-ghost" 
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.75rem',
                  borderRadius: '0.25rem',
                  backgroundColor: uiLang === lang ? 'var(--accent-primary)' : 'transparent',
                  color: uiLang === lang ? '#fff' : 'var(--text-secondary)',
                  height: 'auto'
                }}
                onClick={() => handleUiLanguageChange(lang)}
              >
                {lang === 'ja' ? '日本語' : lang === 'en' ? 'English' : '中文'}
              </button>
            ))}
          </div>

          <div className="toggle-container" onClick={() => {
            const nextMode = !settings.useMockMode;
            if (nextMode && !settings.apiKey) {
              setIsSettingsOpen(true);
              showToast(uiLang === 'zh' ? '请先输入 API 密钥' : 'Please input your API key first');
              return;
            }
            saveSettings({ ...settings, useMockMode: nextMode });
          }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: varColor(settings.useMockMode, '--text-muted', '--accent-secondary') }}>
              {settings.useMockMode ? txt.demo_active : txt.real_active}
            </span>
            <div className={`toggle-switch ${!settings.useMockMode ? 'active' : ''}`} style={{ width: '36px', height: '18px' }} />
          </div>

          <button className="btn btn-secondary" onClick={() => setIsSettingsOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            {txt.api_settings}
          </button>
        </div>
      </header>

      {/* Loading Screen */}
      {isLoading && (
        <div className="loading-screen">
          <div className="spinner" />
          <div className="loading-title">{txt.loading_title}</div>
          <div className="loading-subtitle">{txt.loading_desc}</div>
        </div>
      )}

      {/* Main Contents */}
      {!isLoading && !isOnboarded && (
        <main className="onboarding-outer">
          <div className="onboarding-card">
            {/* Step Progress indicators */}
            <div className="onboarding-progress">
              {steps.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`progress-step ${idx === onboardingStep ? 'active' : ''} ${idx < onboardingStep ? 'completed' : ''}`}
                >
                  {idx < onboardingStep ? '✓' : idx + 1}
                </div>
              ))}
            </div>

            <div className="onboarding-header">
              <h2 className="onboarding-title">{steps[onboardingStep].title}</h2>
              <p className="onboarding-desc">{steps[onboardingStep].desc}</p>
            </div>

            {/* STEP 0: Candidate type selector */}
            {onboardingStep === 0 && (
              <div className="step-content">
                <div className="type-grid">
                  {(['new_grad', 'second_new_grad', 'career_changer', 'cross_industry', 'undecided'] as CandidateType[]).map((t) => (
                    <div 
                      key={t} 
                      className={`type-card ${backgroundData.candidateType === t ? 'selected' : ''}`}
                      onClick={() => handlePresetSelect(t)}
                    >
                      <div className="type-card-title">{typeToLabel(t)}</div>
                      <div className="type-card-desc">
                        {t === 'new_grad' && (uiLang === 'zh' ? '在读大学生或应届毕业生。从校园活动与兼职经历中总结个人实力。' : uiLang === 'en' ? 'Students and fresh graduates. Highlight strengths from university projects or side-jobs.' : '大学生・大学院生・専門学生の方。課外活動やアルバイト経験から強みをアピール。')}
                        {t === 'second_new_grad' && (uiLang === 'zh' ? '工作3年内转职。重点突出跨行业转型的可塑性与积极主动的学习态度。' : uiLang === 'en' ? 'Early-career professionals within 3 years of graduation. Highlight adaptability and potential.' : '就職後3年以内での転身。未経験職種への挑戦や、ポテンシャルをアピール。')}
                        {t === 'career_changer' && (uiLang === 'zh' ? '同岗位跳槽或晋升。重点突出以往的核心战绩、业务数据与即战力。' : uiLang === 'en' ? 'Same occupational change for career advancement. Emphasize metrics and expertise.' : '同じ職種でのキャリアアップ・スペシャリスト転職。実績と専門性をアピール。')}
                        {t === 'cross_industry' && (uiLang === 'zh' ? '跨行业或转职能。提炼以往经历中与目标岗位相匹配的可迁移能力。' : uiLang === 'en' ? 'Pivot to new industry or field. Highlight portable and transferable capabilities.' : '新しい業界や異なる職種への挑戦。これまでの強みを transferable に変換。')}
                        {t === 'undecided' && (uiLang === 'zh' ? '求职方向尚未确定，或希望通过初步输入进行个人优势盘点。' : uiLang === 'en' ? 'Uncertain of direct goals, or looking to map out competencies through brainstorming.' : '転職希望先や自己PRの方向性を迷っている、まずは壁打ちしたい方。')}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="banner-toggle">
                  <div>
                    <strong style={{ fontSize: '0.9rem', display: 'block', color: '#fff' }}>{txt.preset_indicator}</strong>
                    <span style={{ fontSize: '0.8rem', color: varColor(true, '--text-secondary', '--text-muted') }}>{txt.preset_indicator_desc}</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1: Current experience details */}
            {onboardingStep === 1 && (
              <div className="step-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>{txt.current_occ} <span style={{ color: 'var(--accent-secondary)' }}>{txt.required_tag}</span></label>
                    <input 
                      type="text" 
                      className="input-control" 
                      placeholder={uiLang === 'zh' ? "例：服装店销售员、办公室文员、后端开发" : "e.g. Sales rep, Office clerk, Software engineer"}
                      value={backgroundData.currentOccupation} 
                      onChange={(e) => handleInputChange('currentOccupation', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>{txt.current_ind} <span style={{ color: 'var(--accent-secondary)' }}>{txt.required_tag}</span></label>
                    <input 
                      type="text" 
                      className="input-control" 
                      placeholder={uiLang === 'zh' ? "例：零售百货、IT互联网、教育培训" : "e.g. Retail, IT & SaaS, Education"}
                      value={backgroundData.currentIndustry} 
                      onChange={(e) => handleInputChange('currentIndustry', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{txt.years_exp} <span style={{ color: 'var(--accent-secondary)' }}>{txt.required_tag}</span></label>
                    <input 
                      type="text" 
                      className="input-control" 
                      placeholder={uiLang === 'zh' ? "例：3年、1年半、在读中" : "e.g. 3 years, 18 months, Current student"}
                      value={backgroundData.yearsOfExperience} 
                      onChange={(e) => handleInputChange('yearsOfExperience', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>{txt.tools_skills}</label>
                    <input 
                      type="text" 
                      className="input-control" 
                      placeholder={uiLang === 'zh' ? "例：Excel (VLOOKUP), Photoshop, 英语商务" : "e.g. MS Excel (Vlookup), Photoshop, SQL, TOEIC 850"}
                      value={backgroundData.toolsSkills} 
                      onChange={(e) => handleInputChange('toolsSkills', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>{txt.key_tasks} <span className="label-desc">{uiLang === 'zh' ? "(您在日常工作中主要扮演什么角色，完成哪些动作)" : "(Describe your day-to-day duties)"}</span></label>
                  <textarea 
                    className="input-control" 
                    placeholder={uiLang === 'zh' ? "例：负责店内的接客销售、商品入库盘点、利用社群账号进行新客户引入与留存维护..." : "e.g. Handled customer service in store, managed inventory, executed SNS marketing for customer acquisition..."}
                    value={backgroundData.keyTasks} 
                    onChange={(e) => handleInputChange('keyTasks', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>{txt.achievements} <span className="label-desc">{uiLang === 'zh' ? "(请写出您可以被数据佐证的业绩、改善成果)" : "(Metrics and improvements you achieved)"}</span></label>
                  <textarea 
                    className="input-control" 
                    placeholder={uiLang === 'zh' ? "例：达成个人销售目标110%，制定了新人培训手册使培训期缩短了一半时间..." : "e.g. Exceeded sales targets by 10% MoM, created a training handbook reducing training duration by 50%..."}
                    value={backgroundData.achievements} 
                    onChange={(e) => handleInputChange('achievements', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Target career details */}
            {onboardingStep === 2 && (
              <div className="step-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>{txt.target_occ} <span style={{ color: 'var(--accent-secondary)' }}>{txt.required_tag}</span></label>
                    <input 
                      type="text" 
                      className="input-control" 
                      placeholder={uiLang === 'zh' ? "例：SaaS 客户成功 (Customer Success)" : "e.g. Customer Success Manager, B2B IT Sales"}
                      value={backgroundData.targetOccupation} 
                      onChange={(e) => handleInputChange('targetOccupation', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>{txt.target_ind} <span style={{ color: 'var(--accent-secondary)' }}>{txt.required_tag}</span></label>
                    <input 
                      type="text" 
                      className="input-control" 
                      placeholder={uiLang === 'zh' ? "例：IT・SaaS、数字营销" : "e.g. SaaS, Digital Marketing"}
                      value={backgroundData.targetIndustry} 
                      onChange={(e) => handleInputChange('targetIndustry', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>{txt.target_jd} <span className="label-desc">{uiLang === 'zh' ? "(建议直接拷贝招聘网站的JD描述)" : "(Paste the job description of target role)"}</span></label>
                  <textarea 
                    className="input-control" 
                    style={{ minHeight: '110px' }}
                    placeholder={uiLang === 'zh' ? "例：负责引导企业客户顺利完成系统导入，跟进活跃度，降低解约率，发掘增购机会，协同产研团队..." : "e.g. Conduct onboarding for corporate clients, monitor usage metrics, prevent churn, drive up-sells, collect customer feedback for dev team..."}
                    value={backgroundData.targetJd} 
                    onChange={(e) => handleInputChange('targetJd', e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{txt.appeal_skills}</label>
                    <input 
                      type="text" 
                      className="input-control" 
                      placeholder={uiLang === 'zh' ? "例：以数据为支撑的沟通能力、客户视角" : "e.g. Data-driven consulting, active listening, project management"}
                      value={backgroundData.emphasizedSkills} 
                      onChange={(e) => handleInputChange('emphasizedSkills', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>{txt.avoid_content}</label>
                    <input 
                      type="text" 
                      className="input-control" 
                      placeholder={uiLang === 'zh' ? "例：频繁跳槽的原因、缺乏某技术证书的描述" : "e.g. Reason of short tenure, lack of technical programming skills"}
                      value={backgroundData.avoidContent} 
                      onChange={(e) => handleInputChange('avoidContent', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Original resume copy-paste */}
            {onboardingStep === 3 && (
              <div className="step-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {uiLang === 'zh' ? "请粘贴您现有的草稿文本，即使只有零碎的句子，AI 也会根据背景进行结构化拓展与修正。" : "Paste what you have written. The AI will structure, expand, and polish it."}
                </p>
                <div className="form-group">
                  <label>{txt.section_self_pr}</label>
                  <textarea 
                    className="input-control" 
                    placeholder={uiLang === 'zh' ? "例：我做事认真负责，在之前的店铺做销售表现很好，和店里同事相处愉快..." : "e.g. I am hardworking and dedicated. In my last retail job, I had good sales records..."}
                    value={backgroundData.originalSelfPr} 
                    onChange={(e) => handleInputChange('originalSelfPr', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>{txt.section_motivation}</label>
                  <textarea 
                    className="input-control" 
                    placeholder={uiLang === 'zh' ? "例：我一直对贵公司的系统很感兴趣，希望把我的销售沟通技巧发挥在企业客户服务中..." : "e.g. I am highly interested in your company's product, and I want to apply my retail sales experience in helping business clients..."}
                    value={backgroundData.originalMotivation} 
                    onChange={(e) => handleInputChange('originalMotivation', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>{txt.section_work_exp}</label>
                  <textarea 
                    className="input-control" 
                    placeholder={uiLang === 'zh' ? "例：●●有限公司 销售员。负责前台接待、导购，以及陈列和收银..." : "e.g. Retail clerk at XX Co. Ltd. Handled cash register, sales pitch, and stock management..."}
                    value={backgroundData.originalWorkExperience} 
                    onChange={(e) => handleInputChange('originalWorkExperience', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* STEP 4: Review and generate */}
            {onboardingStep === 4 && (
              <div className="step-content">
                <div style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    {uiLang === 'zh' ? '确认添削生成参数' : uiLang === 'en' ? 'Execution Parameters' : '添削実行のパラメータ'}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>{uiLang === 'zh' ? '求职属性' : 'Candidate Type'}:</div>
                    <div style={{ fontWeight: 600, color: 'var(--accent-secondary)' }}>{typeToLabel(backgroundData.candidateType)}</div>
                    
                    <div style={{ color: 'var(--text-secondary)' }}>{uiLang === 'zh' ? '当前岗位' : 'Current Role'}:</div>
                    <div>{backgroundData.currentOccupation} ({backgroundData.currentIndustry} / {backgroundData.yearsOfExperience})</div>
                    
                    <div style={{ color: 'var(--text-secondary)' }}>{uiLang === 'zh' ? '意向目标' : 'Target Role'}:</div>
                    <div style={{ fontWeight: 600 }}>{backgroundData.targetOccupation} ({backgroundData.targetIndustry})</div>

                    <div style={{ color: 'var(--text-secondary)' }}>{uiLang === 'zh' ? '改写语气' : 'Tone'}:</div>
                    <div>
                      {backgroundData.toneStyle === 'professional' && (uiLang === 'zh' ? '稳重专业・体现成熟即战力' : 'Professional, business-focused')}
                      {backgroundData.toneStyle === 'enthusiastic' && (uiLang === 'zh' ? '情热积极・突出自驱力与成长潜力' : 'Enthusiastic, potential-driven')}
                      {backgroundData.toneStyle === 'concise' && (uiLang === 'zh' ? '精炼简洁・突出逻辑与结构化表达' : 'Concise, logic-oriented')}
                      {backgroundData.toneStyle === 'second_new_grad' && (uiLang === 'zh' ? '诚恳谦逊・强调执行力与可塑性' : 'Modest & Adaptable (Second New Grad)')}
                    </div>

                    <div style={{ color: 'var(--text-secondary)' }}>{uiLang === 'zh' ? '分析引擎' : 'Engine'}:</div>
                    <div>
                      {settings.useMockMode ? (
                        <span style={{ color: 'var(--status-warning)' }}>{uiLang === 'zh' ? '演示模拟模式 (使用预设语料库，即刻响应)' : 'Demo Mode (Local library, instant)'}</span>
                      ) : (
                        <span style={{ color: 'var(--status-success)' }}>{uiLang === 'zh' ? `实时 AI 模型 (${settings.model})` : `Real Gemini AI (${settings.model})`}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-row" style={{ marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label>{txt.resume_lang_label}</label>
                    <select 
                      className="input-control"
                      value={backgroundData.resumeLang}
                      onChange={(e) => handleInputChange('resumeLang', e.target.value as any)}
                    >
                      <option value="ja">日本語 (Japanese)</option>
                      <option value="en">English (English)</option>
                      <option value="zh">简体中文 (Chinese)</option>
                      <option value="bilingual">日英・中日双语 (Bilingual)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{txt.tone_style}</label>
                    <select 
                      className="input-control"
                      value={backgroundData.toneStyle}
                      onChange={(e) => handleInputChange('toneStyle', e.target.value as any)}
                    >
                      <option value="professional">{uiLang === 'zh' ? "商务稳重型 (即战力)" : "Professional & Business (Standard)"}</option>
                      <option value="enthusiastic">{uiLang === 'zh' ? "积极进取型 (高自驱)" : "Enthusiastic & Driven (Potential)"}</option>
                      <option value="concise">{uiLang === 'zh' ? "精炼 smart 型 (逻辑清晰)" : "Concise & Structured (外资/咨询)"}</option>
                      <option value="second_new_grad">{uiLang === 'zh' ? "谦虚好学型 (高可塑性)" : "Modest & Learnable (Early Career)"}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Actions */}
            <div className="form-actions">
              <button 
                className="btn btn-secondary" 
                disabled={onboardingStep === 0}
                onClick={() => setOnboardingStep(prev => prev - 1)}
              >
                {txt.prev}
              </button>
              
              {onboardingStep < 4 ? (
                <button 
                  className="btn btn-primary"
                  onClick={() => setOnboardingStep(prev => prev + 1)}
                >
                  {txt.next}
                </button>
              ) : (
                <button 
                  className="btn btn-accent"
                  onClick={handleTriggerAnalysis}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  {txt.run_analysis}
                </button>
              )}
            </div>
          </div>
        </main>
      )}

      {/* DASHBOARD WORKSPACE (Post-Analysis View) */}
      {!isLoading && isOnboarded && analysisResult && (
        <main className="dashboard-workspace">
          {/* Quick Edit Inputs Panel */}
          <aside className="dashboard-sidebar">
            <h3 className="sidebar-title">{txt.sidebar_title}</h3>
            
            <div className="form-group">
              <label>{txt.sidebar_candidate_type}</label>
              <select 
                className="input-control"
                value={backgroundData.candidateType}
                onChange={(e) => {
                  const type = e.target.value as CandidateType;
                  handlePresetSelect(type);
                }}
              >
                <option value="new_grad">{uiLang === 'zh' ? '应届毕业生' : uiLang === 'en' ? 'New Grad' : '新卒採用'}</option>
                <option value="second_new_grad">{uiLang === 'zh' ? '第二新卒' : uiLang === 'en' ? 'Second New Grad' : '第二新卒'}</option>
                <option value="career_changer">{uiLang === 'zh' ? '同职能转职' : uiLang === 'en' ? 'Same occupational change' : '同職種転職'}</option>
                <option value="cross_industry">{uiLang === 'zh' ? '跨行业/职能跳槽' : uiLang === 'en' ? 'Cross-industry Switch' : '異業界・異職種転職'}</option>
                <option value="undecided">{uiLang === 'zh' ? '未定其他' : uiLang === 'en' ? 'Undecided' : '未定・その他'}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{txt.current_occ}</label>
              <input 
                type="text" 
                className="input-control" 
                value={backgroundData.currentOccupation}
                onChange={(e) => handleInputChange('currentOccupation', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>{txt.key_tasks}</label>
              <textarea 
                className="input-control" 
                style={{ minHeight: '80px', fontSize: '0.85rem' }}
                value={backgroundData.keyTasks}
                onChange={(e) => handleInputChange('keyTasks', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>{txt.target_occ}</label>
              <input 
                type="text" 
                className="input-control" 
                value={backgroundData.targetOccupation}
                onChange={(e) => handleInputChange('targetOccupation', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>{txt.appeal_skills}</label>
              <input 
                type="text" 
                className="input-control" 
                value={backgroundData.emphasizedSkills}
                onChange={(e) => handleInputChange('emphasizedSkills', e.target.value)}
              />
            </div>

            <button 
              className="btn btn-primary" 
              style={{ marginTop: '1rem', width: '100%' }}
              onClick={handleTriggerAnalysis}
            >
              {txt.re_analyze}
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%' }}
              onClick={() => {
                setIsOnboarded(false);
                setOnboardingStep(0);
              }}
            >
              {txt.back_to_wizard}
            </button>
          </aside>

          {/* Results Display Panel */}
          <section className="dashboard-main">
            {/* View tabs selector */}
            <div className="workspace-tabs">
              <button 
                className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`}
                onClick={() => setActiveTab('report')}
              >
                {txt.tab_report}
              </button>
              <button 
                className={`tab-btn ${activeTab === 'diff' ? 'active' : ''}`}
                onClick={() => setActiveTab('diff')}
              >
                {txt.tab_diff}
              </button>
              <button 
                className={`tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
                onClick={() => setActiveTab('editor')}
              >
                {txt.tab_editor}
              </button>
            </div>

            {/* TAB 1: Report Details */}
            {activeTab === 'report' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="score-flex-grid">
                  <div className="score-radial-wrapper">
                    <div 
                      className="score-radial" 
                      style={{ '--percentage': analysisResult.score } as React.CSSProperties}
                    >
                      <div className="score-radial-text">
                        {analysisResult.score}<span>{txt.score_unit}</span>
                      </div>
                    </div>
                    <span className="score-badge">{txt.score_label}</span>
                  </div>
                  
                  <div className="score-details-section">
                    <div className="candidate-type-pill">{analysisResult.candidate_type}</div>
                    <h3 className="score-strategy-title">{txt.eval_title}</h3>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{analysisResult.summary}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '1rem', padding: '1.75rem' }}>
                  <div>
                    <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>{txt.current_strengths}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{analysisResult.career_context_summary}</p>
                  </div>
                  <div>
                    <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>{txt.target_requirements}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{analysisResult.target_job_summary}</p>
                  </div>
                </div>

                <div className="metrics-section">
                  <div className="metric-box">
                    <div className="metric-title">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="bullet-icon-check"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
                      {txt.transferable_skills}
                    </div>
                    <div className="metric-tag-list">
                      {analysisResult.transferable_skills.map((skill, index) => (
                        <span key={index} className="metric-tag metric-tag-success">{skill}</span>
                      ))}
                    </div>
                    
                    <div className="metric-title" style={{ marginTop: '0.5rem' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--accent-primary)' }}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                      {txt.matching_points}
                    </div>
                    <ul className="metric-bullet-list">
                      {analysisResult.matched_points.map((pt, index) => (
                        <li key={index} className="metric-bullet-item">
                          <span className="bullet-icon-check">✓</span>
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="metric-box">
                    <div className="metric-title">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="bullet-icon-warning"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg>
                      {txt.weaknesses}
                    </div>
                    <ul className="metric-bullet-list">
                      {analysisResult.weak_points.map((wk, index) => (
                        <li key={index} className="metric-bullet-item">
                          <span className="bullet-icon-warning">!</span>
                          {wk}
                        </li>
                      ))}
                    </ul>

                    <div className="metric-title" style={{ marginTop: '0.5rem' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="bullet-icon-warning"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                      {txt.missing_info}
                    </div>
                    <ul className="metric-bullet-list">
                      {analysisResult.missing_information.map((info, index) => (
                        <li key={index} className="metric-bullet-item" style={{ color: 'var(--status-warning)' }}>
                          <span className="bullet-icon-warning">⚠️</span>
                          {info}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="metric-box">
                  <div className="metric-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--accent-secondary)' }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><circle cx="12" cy="12" r="4"/></svg>
                    {txt.recommended_keywords}
                  </div>
                  <div className="metric-tag-list">
                    {analysisResult.recommended_keywords.map((kw, index) => (
                      <span key={index} className="metric-tag" style={{ border: '1px solid var(--accent-secondary-glow)' }}>{kw}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Before After diff comparisons */}
            {activeTab === 'diff' && (
              <div className="diff-container">
                <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1.25rem' }}>
                  <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.5rem' }}>{txt.strategy_title} ({analysisResult.rewrite_strategy})</h4>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {analysisResult.rewrite_suggestions.map((sug, idx) => (
                      <li key={idx} style={{ marginBottom: '0.25rem' }}>{sug}</li>
                    ))}
                  </ul>
                </div>

                {analysisResult.before_after.map((item, index) => (
                  <div key={index} className="diff-card">
                    <div className="diff-header">
                      <span>{uiLang === 'zh' ? `改写话术对比 #${index + 1}` : uiLang === 'en' ? `Reframing Pair #${index + 1}` : `変換エピソード #${index + 1}`}</span>
                      <span className="diff-reason">{item.reason}</span>
                    </div>
                    <div className="diff-body">
                      <div className="diff-pane diff-pane-left">
                        <span className="pane-label pane-label-before">{uiLang === 'zh' ? '修改前' : uiLang === 'en' ? 'Before (Original)' : '修正前'}</span>
                        {item.before}
                      </div>
                      <div className="diff-pane diff-pane-right">
                        <span className="pane-label pane-label-after">{uiLang === 'zh' ? '修改后' : uiLang === 'en' ? 'After (Optimized)' : '修正後'}</span>
                        {item.after}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: Copy Optimized Resumes */}
            {activeTab === 'editor' && editedSections && (
              <div className="editor-grid">
                <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {txt.editor_banner_desc}
                  </span>
                  <button className="btn btn-accent" onClick={() => {
                    const fullDoc = `【${txt.section_self_pr}】\n${editedSections.self_pr}\n\n【${txt.section_motivation}】\n${editedSections.motivation}\n\n【${txt.section_career_summary}】\n${editedSections.career_summary}\n\n【${txt.section_work_exp}】\n${editedSections.work_experience}\n\n【${txt.section_skills}】\n${editedSections.skills}`;
                    handleCopyText(fullDoc, uiLang === 'zh' ? '完整润色后简历' : 'All sections');
                  }}>
                    {txt.copy_all}
                  </button>
                </div>

                {/* Self PR */}
                {editedSections.self_pr && (
                  <div className="editor-section-card">
                    <div className="section-card-header">
                      <h4 className="section-card-title">
                        {txt.section_self_pr}
                        <span className="section-card-badge">{txt.badge_improved}</span>
                      </h4>
                      <button className="btn btn-ghost" onClick={() => handleCopyText(editedSections.self_pr, txt.section_self_pr)}>
                        {txt.copy}
                      </button>
                    </div>
                    <textarea 
                      className="editor-textarea" 
                      value={editedSections.self_pr}
                      onChange={(e) => setEditedSections({ ...editedSections, self_pr: e.target.value })}
                    />
                  </div>
                )}

                {/* Motivation */}
                {editedSections.motivation && (
                  <div className="editor-section-card">
                    <div className="section-card-header">
                      <h4 className="section-card-title">
                        {txt.section_motivation}
                        <span className="section-card-badge">{txt.badge_improved}</span>
                      </h4>
                      <button className="btn btn-ghost" onClick={() => handleCopyText(editedSections.motivation, txt.section_motivation)}>
                        {txt.copy}
                      </button>
                    </div>
                    <textarea 
                      className="editor-textarea" 
                      value={editedSections.motivation}
                      onChange={(e) => setEditedSections({ ...editedSections, motivation: e.target.value })}
                    />
                  </div>
                )}

                {/* Career Summary */}
                {editedSections.career_summary && (
                  <div className="editor-section-card">
                    <div className="section-card-header">
                      <h4 className="section-card-title">
                        {txt.section_career_summary}
                        <span className="section-card-badge">{txt.badge_improved}</span>
                      </h4>
                      <button className="btn btn-ghost" onClick={() => handleCopyText(editedSections.career_summary, txt.section_career_summary)}>
                        {txt.copy}
                      </button>
                    </div>
                    <textarea 
                      className="editor-textarea" 
                      value={editedSections.career_summary}
                      onChange={(e) => setEditedSections({ ...editedSections, career_summary: e.target.value })}
                    />
                  </div>
                )}

                {/* Work Experience */}
                {editedSections.work_experience && (
                  <div className="editor-section-card">
                    <div className="section-card-header">
                      <h4 className="section-card-title">
                        {txt.section_work_exp}
                        <span className="section-card-badge">{txt.badge_improved}</span>
                      </h4>
                      <button className="btn btn-ghost" onClick={() => handleCopyText(editedSections.work_experience, txt.section_work_exp)}>
                        {txt.copy}
                      </button>
                    </div>
                    <textarea 
                      className="editor-textarea" 
                      value={editedSections.work_experience}
                      onChange={(e) => setEditedSections({ ...editedSections, work_experience: e.target.value })}
                    />
                  </div>
                )}

                {/* Student Activities */}
                {backgroundData.candidateType === 'new_grad' && editedSections.student_experience && (
                  <div className="editor-section-card">
                    <div className="section-card-header">
                      <h4 className="section-card-title">
                        {txt.section_student_exp}
                        <span className="section-card-badge">{txt.badge_improved}</span>
                      </h4>
                      <button className="btn btn-ghost" onClick={() => handleCopyText(editedSections.student_experience, txt.section_student_exp)}>
                        {txt.copy}
                      </button>
                    </div>
                    <textarea 
                      className="editor-textarea" 
                      value={editedSections.student_experience}
                      onChange={(e) => setEditedSections({ ...editedSections, student_experience: e.target.value })}
                    />
                  </div>
                )}

                {/* Skills */}
                {editedSections.skills && (
                  <div className="editor-section-card">
                    <div className="section-card-header">
                      <h4 className="section-card-title">
                        {txt.section_skills}
                        <span className="section-card-badge">{txt.badge_improved}</span>
                      </h4>
                      <button className="btn btn-ghost" onClick={() => handleCopyText(editedSections.skills, txt.section_skills)}>
                        {txt.copy}
                      </button>
                    </div>
                    <textarea 
                      className="editor-textarea" 
                      value={editedSections.skills}
                      onChange={(e) => setEditedSections({ ...editedSections, skills: e.target.value })}
                    />
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      )}

      {/* SETTINGS DIALOG */}
      {isSettingsOpen && (
        <div className="settings-modal-overlay">
          <div className="settings-modal">
            <button className="modal-close" onClick={() => setIsSettingsOpen(false)}>×</button>
            <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '1.25rem' }}>{txt.api_title}</h3>
            
            <div className="form-group">
              <label>{txt.api_mode}</label>
              <div 
                className={`toggle-container ${!settings.useMockMode ? 'active' : ''}`}
                onClick={() => setSettings({ ...settings, useMockMode: !settings.useMockMode })}
                style={{ marginTop: '0.25rem', marginBottom: '0.5rem' }}
              >
                <div className="toggle-switch" />
                <span style={{ fontSize: '0.9rem' }}>{settings.useMockMode ? txt.api_mode_demo : txt.api_mode_real}</span>
              </div>
            </div>

            {!settings.useMockMode && (
              <>
                <div className="form-group">
                  <label>{txt.api_key_label}</label>
                  <input 
                    type="password" 
                    className="input-control" 
                    placeholder="AIzaSy..."
                    value={settings.apiKey}
                    onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {txt.api_key_desc}
                  </span>
                </div>

                <div className="form-group">
                  <label>{txt.model_label}</label>
                  <select 
                    className="input-control"
                    value={settings.model}
                    onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                  >
                    <option value="gemini-1.5-flash">gemini-1.5-flash (Fast & Recommended)</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro (High Quality)</option>
                    <option value="gemini-2.5-flash">gemini-2.5-flash (Next Gen)</option>
                  </select>
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
              <button className="btn btn-secondary" onClick={() => setIsSettingsOpen(false)}>{txt.cancel}</button>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  if (!settings.useMockMode && !settings.apiKey) {
                    showToast(uiLang === 'zh' ? '启用真实接口需要输入API密钥' : 'API Key is required for Real AI mode');
                    return;
                  }
                  saveSettings(settings);
                }}
              >
                {txt.save_settings}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helpers for CSS variables and styling checks
function varColor(isActive: boolean, activeColorVar: string, inactiveColorVar: string): string {
  return `var(${isActive ? activeColorVar : inactiveColorVar})`;
}
