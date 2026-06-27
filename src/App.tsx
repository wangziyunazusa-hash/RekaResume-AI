import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CandidateProfile, DocumentType, GeneratedDocument, JobMatchResult, LanguageMode } from './types/shukatsu';
import { analyzeJobMatch, generateDocument } from './services/shukatsuAgent';

type View = 'home' | 'review' | 'history';
type ReviewStep = 0 | 1 | 2 | 3;

interface ReviewForm {
  currentRole: string;
  currentIndustry: string;
  yearsOfExperience: string;
  keyTasks: string;
  emphasizedSkills: string;
  notes: string;
  targetRole: string;
  targetIndustry: string;
  companyName: string;
  jobText: string;
  requiredSkills: string;
  documentType: DocumentType;
  originalText: string;
  languageMode: LanguageMode;
}

interface ReviewHistoryItem {
  id: string;
  createdAt: string;
  companyName: string;
  targetRole: string;
  documentType: DocumentType;
  matchScore: number;
  improvedText: string;
}

const HISTORY_KEY = 'shukatsu_review_history_v1';

const documentLabels: Record<DocumentType, string> = {
  career_summary: '職務要約',
  self_pr: '自己PR',
  motivation: '志望動機',
  career_change_reason: '転職理由',
  gakuchika: 'ガクチカ',
  one_minute_intro: '面接用自己紹介',
  reverse_questions: '逆質問',
  contribution: '入社後に貢献できること',
};

const toneLabels: Record<LanguageMode, string> = {
  business: 'ビジネス',
  interview: '面接で話しやすい',
  n2_friendly: 'N2向け',
  furigana: 'ふりがな付き',
};

const steps = [
  { label: 'あなたの経験', short: '経験' },
  { label: '応募したい求人', short: '求人' },
  { label: '添削したい内容', short: '書類' },
  { label: '添削結果', short: '結果' },
] as const;

const initialForm: ReviewForm = {
  currentRole: '',
  currentIndustry: '',
  yearsOfExperience: '',
  keyTasks: '',
  emphasizedSkills: '',
  notes: '',
  targetRole: '',
  targetIndustry: '',
  companyName: '',
  jobText: '',
  requiredSkills: '',
  documentType: 'motivation',
  originalText: '',
  languageMode: 'business',
};

export default function App() {
  const [view, setView] = useState<View>('home');
  const [step, setStep] = useState<ReviewStep>(0);
  const [form, setForm] = useState<ReviewForm>(initialForm);
  const [matchResult, setMatchResult] = useState<JobMatchResult | null>(null);
  const [generatedDocument, setGeneratedDocument] = useState<GeneratedDocument | null>(null);
  const [history, setHistory] = useState<ReviewHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) setHistory(JSON.parse(raw));
  }, []);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view, step]);

  const canGoNext = useMemo(() => {
    if (step === 0) return Boolean(form.currentRole.trim() && form.keyTasks.trim());
    if (step === 1) return Boolean(form.targetRole.trim() && form.jobText.trim());
    if (step === 2) return Boolean(form.originalText.trim());
    return true;
  }, [form, step]);

  const updateForm = (patch: Partial<ReviewForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setError('');
  };

  const startReview = () => {
    setView('review');
    setStep(0);
    setError('');
  };

  const goNext = () => {
    if (!canGoNext) {
      setError(getValidationMessage(step));
      return;
    }
    setStep((prev) => Math.min(prev + 1, 3) as ReviewStep);
  };

  const runReview = async () => {
    if (!form.jobText.trim() || !form.originalText.trim()) {
      setError('求人内容または添削したい文章を入力してください。');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const profile: CandidateProfile = {
        id: 'current-user',
        currentRole: form.currentRole,
        currentIndustry: form.currentIndustry,
        yearsOfExperience: form.yearsOfExperience,
        languages: ['日本語', 'English', '中文'],
        targetRole: form.targetRole,
        targetIndustry: form.targetIndustry,
        candidateType: 'unknown',
      };

      const resumeText = [
        `現在の職種: ${form.currentRole}`,
        `現在の業界: ${form.currentIndustry}`,
        `経験年数: ${form.yearsOfExperience}`,
        `主な仕事内容: ${form.keyTasks}`,
        `強調したい経験・スキル: ${form.emphasizedSkills}`,
        `補足情報: ${form.notes}`,
        `添削したい原文: ${form.originalText}`,
      ].join('\n');

      const jobText = [
        `会社名: ${form.companyName}`,
        `応募職種: ${form.targetRole}`,
        `応募業界: ${form.targetIndustry}`,
        `求人票 / JD: ${form.jobText}`,
        `求められるスキル: ${form.requiredSkills}`,
      ].join('\n');

      const nextMatchResult = await analyzeJobMatch({
        profile,
        resumeText,
        jobText,
        uploadedFileNames: [],
      });
      const nextDocument = await generateDocument({
        type: form.documentType,
        languageMode: form.languageMode,
        resumeText,
        jobText,
        extraInfo: form.originalText,
        matchResult: nextMatchResult,
      });

      setMatchResult(nextMatchResult);
      setGeneratedDocument(nextDocument);
      setStep(3);
    } catch {
      setError('AI添削中にエラーが発生しました。少し時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const copyResult = async () => {
    if (!generatedDocument) return;
    await navigator.clipboard.writeText(generatedDocument.content);
    showToast('修正後の文章をコピーしました。');
  };

  const saveResult = () => {
    if (!generatedDocument || !matchResult) return;
    const item: ReviewHistoryItem = {
      id: generatedDocument.id,
      createdAt: generatedDocument.createdAt,
      companyName: form.companyName || '会社名未入力',
      targetRole: form.targetRole || '応募職種未入力',
      documentType: form.documentType,
      matchScore: matchResult.matchScore,
      improvedText: generatedDocument.content,
    };
    setHistory((prev) => [item, ...prev.filter((entry) => entry.id !== item.id)]);
    showToast('履歴に保存しました。');
  };

  const resetReview = () => {
    setMatchResult(null);
    setGeneratedDocument(null);
    setStep(2);
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  };

  return (
    <div className="app-shell">
      <Header view={view} setView={setView} startReview={startReview} />
      {toast && <div className="toast">{toast}</div>}

      {view === 'home' && <HomePage startReview={startReview} />}
      {view === 'review' && (
        <main className="page-shell">
          <Stepper step={step} />
          {error && <div className="form-error">{error}</div>}
          {step === 0 && <CandidateBackgroundStep form={form} updateForm={updateForm} onNext={goNext} />}
          {step === 1 && <TargetJobStep form={form} updateForm={updateForm} onPrev={() => setStep(0)} onNext={goNext} />}
          {step === 2 && (
            <DocumentInputStep
              form={form}
              updateForm={updateForm}
              onPrev={() => setStep(1)}
              onSubmit={runReview}
              loading={loading}
            />
          )}
          {step === 3 && matchResult && generatedDocument && (
            <ReviewResult
              form={form}
              matchResult={matchResult}
              generatedDocument={generatedDocument}
              onCopy={copyResult}
              onSave={saveResult}
              onEditAgain={resetReview}
              onNewDocument={() => setStep(2)}
              onInterview={() => showToast('面接練習は次のアップデートでこの内容から開始できます。')}
              onSaveJob={saveResult}
            />
          )}
        </main>
      )}
      {view === 'history' && <HistoryPage history={history} setHistory={setHistory} copyText={showToast} />}
    </div>
  );
}

function Header({ view, setView, startReview }: { view: View; setView: (view: View) => void; startReview: () => void }) {
  return (
    <header className="site-header">
      <button className="brand" onClick={() => setView('home')} aria-label="Home">
        <span className="brand-mark">書</span>
        <span>
          <strong>Shukatsu Copilot</strong>
          <small>日本就職向け応募書類添削</small>
        </span>
      </button>
      <nav className="main-nav" aria-label="Primary">
        <button className={view === 'review' ? 'active' : ''} onClick={startReview}>添削する</button>
        <button className={view === 'history' ? 'active' : ''} onClick={() => setView('history')}>履歴</button>
      </nav>
    </header>
  );
}

function HomePage({ startReview }: { startReview: () => void }) {
  return (
    <main className="home-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">日本就職の応募書類を、順番に整える</p>
          <h1>AIで日本就職向けの応募書類をわかりやすく改善</h1>
          <p className="hero-copy">
            履歴書・職務経歴書・自己PR・志望動機を、求人内容に合わせて自然な日本語に整えます。
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={startReview}>書類を添削する</button>
            <a className="btn btn-secondary" href="#how-it-works">使い方を見る</a>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="simple-section">
        <div className="section-heading">
          <span>3 steps</span>
          <h2>入力する順番はシンプルです</h2>
        </div>
        <div className="three-grid">
          <StepCard number="1" title="現在の経験を入力" />
          <StepCard number="2" title="求人内容を入力" />
          <StepCard number="3" title="AIが改善案を提案" />
        </div>
      </section>

      <section className="simple-section">
        <div className="section-heading">
          <span>Features</span>
          <h2>応募先に合わせて、伝わる表現へ</h2>
        </div>
        <div className="three-grid">
          <FeatureCard title="求人に合わせて改善" text="応募先が求める経験やスキルに合わせて、伝える順番を整理します。" />
          <FeatureCard title="自然なビジネス日本語に修正" text="直訳っぽい表現を、応募書類として読みやすい日本語に整えます。" />
          <FeatureCard title="修正理由までわかる" text="どこをなぜ変えたのかを確認できるので、面接準備にも使えます。" />
        </div>
      </section>
    </main>
  );
}

function Stepper({ step }: { step: ReviewStep }) {
  return (
    <div className="stepper" aria-label="Review steps">
      {steps.map((item, index) => (
        <div key={item.label} className={`stepper-item ${index === step ? 'current' : ''} ${index < step ? 'done' : ''}`}>
          <span>{index + 1}</span>
          <strong>{item.label}</strong>
          <small>{item.short}</small>
        </div>
      ))}
    </div>
  );
}

function CandidateBackgroundStep({ form, updateForm, onNext }: StepProps & { onNext: () => void }) {
  return (
    <section className="flow-card">
      <StepHeader title="あなたの経験" description="まず、現在の仕事や経験を教えてください。" />
      <div className="form-grid">
        <Field label="現在の職種" required>
          <input value={form.currentRole} onChange={(e) => updateForm({ currentRole: e.target.value })} placeholder="例：営業事務、マーケティング、ソフトウェアエンジニア" />
        </Field>
        <Field label="現在の業界">
          <input value={form.currentIndustry} onChange={(e) => updateForm({ currentIndustry: e.target.value })} placeholder="例：教育、IT、小売、メーカー" />
        </Field>
        <Field label="経験年数">
          <input value={form.yearsOfExperience} onChange={(e) => updateForm({ yearsOfExperience: e.target.value })} placeholder="例：2年、半年、在学中" />
        </Field>
        <Field label="強調したい経験・スキル">
          <input value={form.emphasizedSkills} onChange={(e) => updateForm({ emphasizedSkills: e.target.value })} placeholder="例：顧客対応、データ分析、チーム調整" />
        </Field>
      </div>
      <Field label="主な仕事内容" required>
        <textarea value={form.keyTasks} onChange={(e) => updateForm({ keyTasks: e.target.value })} placeholder="例：顧客からの問い合わせ対応、資料作成、社内メンバーとの調整を担当しました。" />
      </Field>
      <Field label="補足情報" optional>
        <textarea className="short-textarea" value={form.notes} onChange={(e) => updateForm({ notes: e.target.value })} placeholder="例：日本語はN2、英語での顧客対応経験があります。" />
      </Field>
      <div className="flow-actions right">
        <button className="btn btn-primary" onClick={onNext}>次へ</button>
      </div>
    </section>
  );
}

function TargetJobStep({ form, updateForm, onPrev, onNext }: StepProps & { onPrev: () => void; onNext: () => void }) {
  return (
    <section className="flow-card">
      <StepHeader title="応募したい求人" description="応募先の仕事内容や求められるスキルを入力してください。" />
      <div className="form-grid">
        <Field label="応募職種" required>
          <input value={form.targetRole} onChange={(e) => updateForm({ targetRole: e.target.value })} placeholder="例：カスタマーサクセス、商品企画、法人営業" />
        </Field>
        <Field label="応募業界">
          <input value={form.targetIndustry} onChange={(e) => updateForm({ targetIndustry: e.target.value })} placeholder="例：SaaS、人材、メーカー、広告" />
        </Field>
        <Field label="会社名" optional>
          <input value={form.companyName} onChange={(e) => updateForm({ companyName: e.target.value })} placeholder="例：株式会社〇〇" />
        </Field>
        <Field label="求められるスキル" optional>
          <input value={form.requiredSkills} onChange={(e) => updateForm({ requiredSkills: e.target.value })} placeholder="例：顧客折衝、要件整理、Excel" />
        </Field>
      </div>
      <Field label="求人票 / JD テキスト" required>
        <textarea className="large-textarea" value={form.jobText} onChange={(e) => updateForm({ jobText: e.target.value })} placeholder="求人票や会社ページの仕事内容・必須条件・歓迎条件を貼り付けてください。" />
      </Field>
      <div className="upload-note">
        画像・PDFアップロードは今後の拡張予定です。今は求人票の文章を貼り付けると、より正確に添削できます。
      </div>
      <div className="flow-actions">
        <button className="btn btn-secondary" onClick={onPrev}>戻る</button>
        <button className="btn btn-primary" onClick={onNext}>次へ</button>
      </div>
    </section>
  );
}

function DocumentInputStep({ form, updateForm, onPrev, onSubmit, loading }: StepProps & { onPrev: () => void; onSubmit: () => void; loading: boolean }) {
  return (
    <section className="flow-card">
      <StepHeader title="添削したい内容" description="直したい文章を入力し、出力のトーンを選んでください。" />
      <div className="field-block">
        <div className="field-label">添削したい書類タイプ</div>
        <div className="segmented-grid">
          {(['self_pr', 'motivation', 'career_summary', 'career_change_reason', 'gakuchika', 'one_minute_intro'] as DocumentType[]).map((type) => (
            <button key={type} className={form.documentType === type ? 'selected' : ''} onClick={() => updateForm({ documentType: type })}>
              {documentLabels[type]}
            </button>
          ))}
        </div>
      </div>
      <Field label="原文" required>
        <textarea className="large-textarea focus-textarea" value={form.originalText} onChange={(e) => updateForm({ originalText: e.target.value })} placeholder="添削したい自己PR・志望動機などを貼り付けてください。短いメモでも大丈夫です。" />
      </Field>
      <div className="field-block">
        <div className="field-label">出力语气 / トーン</div>
        <div className="tone-row">
          {(['business', 'interview', 'n2_friendly'] as LanguageMode[]).map((mode) => (
            <button key={mode} className={form.languageMode === mode ? 'selected' : ''} onClick={() => updateForm({ languageMode: mode })}>
              {toneLabels[mode]}
            </button>
          ))}
        </div>
      </div>
      <div className="flow-actions">
        <button className="btn btn-secondary" onClick={onPrev}>戻る</button>
        <button className="btn btn-primary" onClick={onSubmit} disabled={loading}>{loading ? 'AI添削中...' : 'AIで添削する'}</button>
      </div>
    </section>
  );
}

function ReviewResult({ form, matchResult, generatedDocument, onCopy, onSave, onEditAgain, onNewDocument, onInterview, onSaveJob }: {
  form: ReviewForm;
  matchResult: JobMatchResult;
  generatedDocument: GeneratedDocument;
  onCopy: () => void;
  onSave: () => void;
  onEditAgain: () => void;
  onNewDocument: () => void;
  onInterview: () => void;
  onSaveJob: () => void;
}) {
  return (
    <section className="result-section">
      <div className="result-layout">
        <aside className="analysis-panel">
          <div className="score-box">
            <span>総合評価</span>
            <strong>{matchResult.matchScore}</strong>
            <small>/100</small>
          </div>
          <AnalysisGroup title="良い点" items={matchResult.strongMatches} />
          <AnalysisGroup title="改善ポイント" items={matchResult.riskPoints} />
          <AnalysisGroup title="足りない情報" items={matchResult.missingInfo} />
          <div className="keyword-box">
            <h3>おすすめキーワード</h3>
            <div>
              {matchResult.recommendedKeywords.map((keyword) => <span key={keyword}>{keyword}</span>)}
            </div>
          </div>
        </aside>

        <article className="improved-panel">
          <div className="result-heading">
            <div>
              <p>{documentLabels[form.documentType]}</p>
              <h2>修正後の文章</h2>
            </div>
            <button className="btn btn-secondary" onClick={onCopy}>コピー</button>
          </div>
          <pre>{generatedDocument.content}</pre>
          <div className="reason-box">
            <h3>修正理由</h3>
            <p>{generatedDocument.explanation}</p>
          </div>
          <div className="flow-actions result-actions">
            <button className="btn btn-primary" onClick={onSave}>保存する</button>
            <button className="btn btn-secondary" onClick={onEditAgain}>もう一度編集する</button>
          </div>
        </article>
      </div>

      <section className="next-actions">
        <h2>次にできること</h2>
        <div className="next-action-grid">
          <button onClick={onNewDocument}>この内容で別の書類を作る</button>
          <button onClick={onInterview}>面接回答を練習する</button>
          <button onClick={onSaveJob}>この求人を保存する</button>
        </div>
      </section>
    </section>
  );
}

function HistoryPage({ history, setHistory, copyText }: {
  history: ReviewHistoryItem[];
  setHistory: (history: ReviewHistoryItem[]) => void;
  copyText: (message: string) => void;
}) {
  const copyHistory = async (item: ReviewHistoryItem) => {
    await navigator.clipboard.writeText(item.improvedText);
    copyText('履歴からコピーしました。');
  };

  return (
    <main className="page-shell">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">History</p>
          <h1>添削履歴</h1>
          <p>保存した添削結果をあとから確認できます。</p>
        </div>
        {history.length > 0 && <button className="btn btn-secondary" onClick={() => setHistory([])}>履歴を消去</button>}
      </div>
      <div className="history-list">
        {history.length === 0 && <div className="empty-card">まだ保存された添削結果はありません。</div>}
        {history.map((item) => (
          <article className="history-card" key={item.id}>
            <div>
              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              <h2>{item.companyName} / {item.targetRole}</h2>
              <p>{documentLabels[item.documentType]} · 評価 {item.matchScore}/100</p>
            </div>
            <button className="btn btn-secondary" onClick={() => copyHistory(item)}>コピー</button>
          </article>
        ))}
      </div>
    </main>
  );
}

interface StepProps {
  form: ReviewForm;
  updateForm: (patch: Partial<ReviewForm>) => void;
}

function StepHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="step-header">
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}

function Field({ label, children, required, optional }: { label: string; children: ReactNode; required?: boolean; optional?: boolean }) {
  return (
    <label className="field-block">
      <span className="field-label">
        {label}
        {required && <em>必須</em>}
        {optional && <small>任意</small>}
      </span>
      {children}
    </label>
  );
}

function StepCard({ number, title }: { number: string; title: string }) {
  return (
    <div className="step-card">
      <span>{number}</span>
      <h3>{title}</h3>
    </div>
  );
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="feature-card">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function AnalysisGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="analysis-group">
      <h3>{title}</h3>
      <ul>
        {items.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function getValidationMessage(step: ReviewStep) {
  if (step === 0) return '現在の職種と主な仕事内容を入力してください。';
  if (step === 1) return '応募職種と求人内容を入力してください。';
  if (step === 2) return '添削したい文章を入力してください。';
  return '';
}
