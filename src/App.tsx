import { useEffect, useMemo, useState } from 'react';
import { runResumeReviewManagedAgent } from './lib/agents/resumeReviewAgent';
import type {
  ResumeReviewAgentInput,
  ResumeReviewAgentOutput,
  ResumeReviewDocumentType,
  ResumeReviewTone,
} from './lib/agents/types';

type View = 'home' | 'workspace' | 'history';

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
  documentType: ResumeReviewDocumentType;
  originalText: string;
  tone: ResumeReviewTone;
}

interface ReviewHistoryItem {
  id: string;
  createdAt: string;
  companyName: string;
  targetRole: string;
  documentType: ResumeReviewDocumentType;
  matchScore: number;
  improvedText: string;
}

const HISTORY_KEY = 'shukatsu_review_history_v1';

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
  tone: 'business',
};

const documentLabels: Record<ResumeReviewDocumentType, string> = {
  career_summary: '履歴書',
  self_pr: '自己PR',
  motivation: 'ES / 志望動機',
  work_experience: '職務経歴書',
  gakuchika: 'ガクチカ',
  interview_intro: '面接練習',
};

const documentDescriptions: Record<ResumeReviewDocumentType, string> = {
  career_summary: '基本情報と経歴を整理',
  self_pr: '強みが伝わる自己PR',
  motivation: '求人に合わせた志望動機',
  work_experience: '職務経歴を日本語で整理',
  gakuchika: '学生時代の経験を構造化',
  interview_intro: '面接で話しやすい内容',
};

const workflowSteps = [
  { title: 'Upload', text: 'Resume / JD / screenshot' },
  { title: 'AI Agent Analysis', text: '経験と求人内容を理解' },
  { title: 'Generate Documents', text: '日本語の応募書類を作成' },
  { title: 'Review / Export', text: '編集・コピー・保存' },
];

const agentSteps = [
  'Reading uploaded resume',
  'Extracting career information',
  'Matching JD requirements',
  'Generating Japanese business wording',
  'Improving keigo and natural Japanese',
  'Preparing exportable document',
];

function toAgentInput(form: ReviewForm, uploadedFileNames: string[]): ResumeReviewAgentInput {
  return {
    candidate: {
      currentRole: form.currentRole,
      currentIndustry: form.currentIndustry,
      yearsOfExperience: form.yearsOfExperience,
      mainTasks: form.keyTasks,
      strengths: form.emphasizedSkills,
      additionalInfo: [form.notes, uploadedFileNames.length ? `Uploaded files: ${uploadedFileNames.join(', ')}` : '']
        .filter(Boolean)
        .join('\n'),
    },
    targetJob: {
      role: form.targetRole,
      industry: form.targetIndustry,
      companyName: form.companyName,
      jobDescription: form.jobText,
      requiredSkills: form.requiredSkills,
    },
    document: {
      type: form.documentType,
      originalText: form.originalText,
      tone: form.tone,
    },
  };
}

async function requestResumeReview(input: ResumeReviewAgentInput): Promise<ResumeReviewAgentOutput> {
  try {
    const response = await fetch('/api/agent/resume-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) throw new Error('API route unavailable');
    return (await response.json()) as ResumeReviewAgentOutput;
  } catch {
    return runResumeReviewManagedAgent(input, { allowMockFallback: true });
  }
}

export default function App() {
  const [view, setView] = useState<View>('home');
  const [form, setForm] = useState<ReviewForm>(initialForm);
  const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([]);
  const [agentOutput, setAgentOutput] = useState<ResumeReviewAgentOutput | null>(null);
  const [editedText, setEditedText] = useState('');
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
  }, [view]);

  const readiness = useMemo(() => {
    const required = [form.currentRole, form.keyTasks, form.targetRole, form.jobText, form.originalText];
    return Math.round((required.filter((item) => item.trim()).length / required.length) * 100);
  }, [form]);

  const updateForm = (patch: Partial<ReviewForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setError('');
  };

  const startWorkspace = () => {
    setView('workspace');
    setError('');
  };

  const runReview = async () => {
    if (!form.jobText.trim() || !form.originalText.trim() || !form.currentRole.trim() || !form.keyTasks.trim() || !form.targetRole.trim()) {
      setError('現在の経験、求人内容、添削したい文章を入力してください。');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const nextOutput = await requestResumeReview(toAgentInput(form, uploadedFileNames));
      setAgentOutput(nextOutput);
      setEditedText(nextOutput.improvedText);
    } catch {
      setError('AI添削中にエラーが発生しました。少し時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const copyResult = async () => {
    if (!agentOutput) return;
    await navigator.clipboard.writeText(editedText || agentOutput.improvedText);
    showToast('生成文をコピーしました。');
  };

  const saveResult = () => {
    if (!agentOutput) return;
    const item: ReviewHistoryItem = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      companyName: form.companyName || '会社名未入力',
      targetRole: form.targetRole || '応募職種未入力',
      documentType: form.documentType,
      matchScore: agentOutput.score,
      improvedText: editedText || agentOutput.improvedText,
    };
    setHistory((prev) => [item, ...prev]);
    showToast('履歴に保存しました。');
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  };

  return (
    <div className="app-shell">
      <Header view={view} setView={setView} startWorkspace={startWorkspace} />
      {toast && <div className="toast">{toast}</div>}

      {view === 'home' && <HomePage startWorkspace={startWorkspace} />}
      {view === 'workspace' && (
        <WorkspacePage
          form={form}
          updateForm={updateForm}
          uploadedFileNames={uploadedFileNames}
          setUploadedFileNames={setUploadedFileNames}
          agentOutput={agentOutput}
          editedText={editedText}
          setEditedText={setEditedText}
          loading={loading}
          error={error}
          readiness={readiness}
          runReview={runReview}
          copyResult={copyResult}
          saveResult={saveResult}
          showToast={showToast}
        />
      )}
      {view === 'history' && <HistoryPage history={history} setHistory={setHistory} showToast={showToast} />}
    </div>
  );
}

function Header({ view, setView, startWorkspace }: { view: View; setView: (view: View) => void; startWorkspace: () => void }) {
  return (
    <header className="site-header">
      <button className="brand" onClick={() => setView('home')} aria-label="Home">
        <span className="brand-mark">S</span>
        <span>
          <strong>Shukatsu Copilot</strong>
          <small>Gemini managed agent for Japan job documents</small>
        </span>
      </button>
      <nav className="main-nav" aria-label="Primary navigation">
        <button className={view === 'workspace' ? 'active' : ''} onClick={startWorkspace}>Workspace</button>
        <button className={view === 'history' ? 'active' : ''} onClick={() => setView('history')}>History</button>
      </nav>
    </header>
  );
}

function HomePage({ startWorkspace }: { startWorkspace: () => void }) {
  return (
    <main className="home-shell">
      <section className="hero-shell">
        <div className="hero-copy-block">
          <div className="product-pill">Powered by Gemini Managed Agent</div>
          <h1>外国人求職者のための日本就職書類作成エージェント</h1>
          <p>
            履歴書、職務経歴書、ES、志望動機、自己PR、面接練習の内容を、求人票に合わせて自然な日本語へ整えます。
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={startWorkspace}>Start with your resume</button>
            <a className="btn btn-secondary" href="#workflow">View workflow</a>
          </div>
        </div>
        <div className="hero-preview-card">
          <div className="preview-toolbar">
            <span />
            <span />
            <span />
          </div>
          <div className="preview-line strong" />
          <div className="preview-line" />
          <div className="preview-line short" />
          <div className="preview-score">
            <strong>82</strong>
            <span>Japan-fit score</span>
          </div>
        </div>
      </section>

      <section id="workflow" className="section-block">
        <SectionTitle eyebrow="Workflow" title="Upload → AI Agent Analysis → Generate Documents → Review / Export" />
        <div className="workflow-grid">
          {workflowSteps.map((step, index) => (
            <article className="workflow-card" key={step.title}>
              <span>{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block">
        <SectionTitle eyebrow="Outputs" title="日本就職に必要な書類をまとめてサポート" />
        <DocumentTypeCards selected="motivation" onSelect={() => startWorkspace()} />
      </section>
    </main>
  );
}

function WorkspacePage(props: {
  form: ReviewForm;
  updateForm: (patch: Partial<ReviewForm>) => void;
  uploadedFileNames: string[];
  setUploadedFileNames: (names: string[]) => void;
  agentOutput: ResumeReviewAgentOutput | null;
  editedText: string;
  setEditedText: (text: string) => void;
  loading: boolean;
  error: string;
  readiness: number;
  runReview: () => void;
  copyResult: () => void;
  saveResult: () => void;
  showToast: (message: string) => void;
}) {
  return (
    <main className="workspace-shell">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">App workspace</p>
          <h1>Japan job application workspace</h1>
          <p>Upload materials, guide the Gemini agent, and review generated Japanese documents in one focused screen.</p>
        </div>
        <div className="readiness-chip">{props.readiness}% ready</div>
      </div>

      {props.error && <div className="form-error">{props.error}</div>}

      <section className="workspace-grid">
        <InputPanel {...props} />
        <AgentStatusPanel loading={props.loading} agentOutput={props.agentOutput} readiness={props.readiness} runReview={props.runReview} />
        <OutputPanel
          form={props.form}
          agentOutput={props.agentOutput}
          editedText={props.editedText}
          setEditedText={props.setEditedText}
          copyResult={props.copyResult}
          saveResult={props.saveResult}
          showToast={props.showToast}
        />
      </section>
    </main>
  );
}

function InputPanel({
  form,
  updateForm,
  uploadedFileNames,
  setUploadedFileNames,
}: {
  form: ReviewForm;
  updateForm: (patch: Partial<ReviewForm>) => void;
  uploadedFileNames: string[];
  setUploadedFileNames: (names: string[]) => void;
}) {
  return (
    <aside className="workspace-panel input-panel">
      <PanelHeader title="1. Upload & inputs" text="Resume, JD, and document draft" />
      <label className="upload-box">
        <input
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.doc,.docx"
          onChange={(event) => setUploadedFileNames(Array.from(event.target.files || []).map((file) => file.name))}
        />
        <strong>Upload resume / JD screenshot</strong>
        <span>PDF, image, or text file. In this demo, filenames are passed to the agent context.</span>
      </label>
      <div className="file-list">
        {uploadedFileNames.length ? uploadedFileNames.map((name) => <span key={name}>{name}</span>) : <span>No file selected</span>}
      </div>

      <div className="field-grid">
        <Field label="Current role" required>
          <input value={form.currentRole} onChange={(e) => updateForm({ currentRole: e.target.value })} placeholder="例：営業事務" />
        </Field>
        <Field label="Target role" required>
          <input value={form.targetRole} onChange={(e) => updateForm({ targetRole: e.target.value })} placeholder="例：カスタマーサクセス" />
        </Field>
      </div>
      <div className="field-grid">
        <Field label="Current industry">
          <input value={form.currentIndustry} onChange={(e) => updateForm({ currentIndustry: e.target.value })} placeholder="例：教育 / SaaS" />
        </Field>
        <Field label="Experience">
          <input value={form.yearsOfExperience} onChange={(e) => updateForm({ yearsOfExperience: e.target.value })} placeholder="例：2年" />
        </Field>
      </div>
      <Field label="Career information" required>
        <textarea value={form.keyTasks} onChange={(e) => updateForm({ keyTasks: e.target.value })} placeholder="主な仕事内容、成果、強みを書いてください。" />
      </Field>
      <Field label="Job description / JD" required>
        <textarea value={form.jobText} onChange={(e) => updateForm({ jobText: e.target.value })} placeholder="求人票、必須条件、歓迎条件を貼り付けてください。" />
      </Field>
      <Field label="Original document" required>
        <textarea value={form.originalText} onChange={(e) => updateForm({ originalText: e.target.value })} placeholder="添削したい自己PR・志望動機などを貼り付けてください。" />
      </Field>
      <Field label="Strengths / skills">
        <input value={form.emphasizedSkills} onChange={(e) => updateForm({ emphasizedSkills: e.target.value })} placeholder="例：顧客対応、業務改善" />
      </Field>
      <Field label="Company / required skills">
        <div className="split-row">
          <input value={form.companyName} onChange={(e) => updateForm({ companyName: e.target.value })} placeholder="会社名" />
          <input value={form.requiredSkills} onChange={(e) => updateForm({ requiredSkills: e.target.value })} placeholder="求められるスキル" />
        </div>
      </Field>
      <DocumentTypeCards selected={form.documentType} onSelect={(documentType) => updateForm({ documentType })} compact />
      <div className="tone-row">
        {(['natural', 'business', 'interview', 'n2'] as ResumeReviewTone[]).map((tone) => (
          <button key={tone} className={form.tone === tone ? 'selected' : ''} onClick={() => updateForm({ tone })}>
            {tone === 'natural' && '自然'}
            {tone === 'business' && 'ビジネス'}
            {tone === 'interview' && '面接向け'}
            {tone === 'n2' && 'N2向け'}
          </button>
        ))}
      </div>
    </aside>
  );
}

function AgentStatusPanel({
  loading,
  agentOutput,
  readiness,
  runReview,
}: {
  loading: boolean;
  agentOutput: ResumeReviewAgentOutput | null;
  readiness: number;
  runReview: () => void;
}) {
  return (
    <section className="workspace-panel agent-panel">
      <PanelHeader title="2. Gemini agent" text="Managed analysis pipeline" />
      <div className="agent-orb">
        <span>{loading ? 'Working' : agentOutput ? 'Done' : 'Ready'}</span>
      </div>
      <div className="progress-track">
        <div style={{ width: `${agentOutput ? 100 : loading ? 68 : readiness}%` }} />
      </div>
      <div className="agent-step-list">
        {agentSteps.map((step, index) => {
          const done = agentOutput || (loading && index < 4) || (!loading && readiness > index * 16);
          return (
            <div className={done ? 'done' : ''} key={step}>
              <span>{done ? '✓' : index + 1}</span>
              <p>{step}</p>
            </div>
          );
        })}
      </div>
      <button className="btn btn-primary run-button" onClick={runReview} disabled={loading}>
        {loading ? 'Gemini agent is generating...' : 'Run Gemini managed agent'}
      </button>
      <p className="privacy-note">
        API keys stay server-side. GitHub Pages demo uses mock fallback when the API route is unavailable.
      </p>
    </section>
  );
}

function OutputPanel({
  form,
  agentOutput,
  editedText,
  setEditedText,
  copyResult,
  saveResult,
  showToast,
}: {
  form: ReviewForm;
  agentOutput: ResumeReviewAgentOutput | null;
  editedText: string;
  setEditedText: (text: string) => void;
  copyResult: () => void;
  saveResult: () => void;
  showToast: (message: string) => void;
}) {
  return (
    <aside className="workspace-panel output-panel">
      <PanelHeader title="3. Generated preview" text="Review, edit, copy, or continue" />
      {!agentOutput && (
        <div className="empty-preview">
          <strong>Generated Japanese document will appear here.</strong>
          <p>Run the Gemini managed agent after entering the resume, JD, and original draft.</p>
        </div>
      )}
      {agentOutput && (
        <>
          <div className="score-summary">
            <strong>{agentOutput.score}</strong>
            <span>Japan-fit score</span>
          </div>
          <div className="summary-strip">
            <p>{agentOutput.agentReasoningSummary}</p>
          </div>
          <div className="document-preview">
            <div className="document-preview-header">
              <span>{documentLabels[form.documentType]}</span>
              <button onClick={copyResult}>Copy</button>
            </div>
            <textarea
              className="generated-editor"
              value={editedText}
              onChange={(event) => setEditedText(event.target.value)}
              aria-label="Generated document editor"
            />
          </div>
          <div className="revision-list">
            <h3>Revision reasons</h3>
            {agentOutput.revisionReasons.map((item) => (
              <div key={`${item.before}-${item.after}`}>
                <p><b>Before:</b> {item.before}</p>
                <p><b>After:</b> {item.after}</p>
                <span>{item.reason}</span>
              </div>
            ))}
          </div>
          <div className="next-action-grid compact-actions">
            <button onClick={saveResult}>Save</button>
            <button onClick={() => showToast('Interview preparation can continue from this generated content.')}>Interview prep</button>
          </div>
        </>
      )}
    </aside>
  );
}

function DocumentTypeCards({
  selected,
  onSelect,
  compact,
}: {
  selected: ResumeReviewDocumentType;
  onSelect: (type: ResumeReviewDocumentType) => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? 'document-card-grid compact' : 'document-card-grid'}>
      {(['career_summary', 'work_experience', 'motivation', 'self_pr', 'interview_intro'] as ResumeReviewDocumentType[]).map((type) => (
        <button key={type} className={selected === type ? 'selected' : ''} onClick={() => onSelect(type)}>
          <strong>{documentLabels[type]}</strong>
          <span>{documentDescriptions[type]}</span>
        </button>
      ))}
    </div>
  );
}

function HistoryPage({
  history,
  setHistory,
  showToast,
}: {
  history: ReviewHistoryItem[];
  setHistory: (history: ReviewHistoryItem[]) => void;
  showToast: (message: string) => void;
}) {
  const copyHistory = async (item: ReviewHistoryItem) => {
    await navigator.clipboard.writeText(item.improvedText);
    showToast('履歴からコピーしました。');
  };

  return (
    <main className="workspace-shell">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">History</p>
          <h1>Saved documents</h1>
          <p>Review and reuse generated Japanese application content.</p>
        </div>
        {history.length > 0 && <button className="btn btn-secondary" onClick={() => setHistory([])}>Clear history</button>}
      </div>
      <div className="history-list">
        {history.length === 0 && <div className="empty-card">No saved documents yet.</div>}
        {history.map((item) => (
          <article className="history-card" key={item.id}>
            <div>
              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              <h2>{item.companyName} / {item.targetRole}</h2>
              <p>{documentLabels[item.documentType]} · Score {item.matchScore}/100</p>
            </div>
            <button className="btn btn-secondary" onClick={() => copyHistory(item)}>Copy</button>
          </article>
        ))}
      </div>
    </main>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="section-heading">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
    </div>
  );
}

function PanelHeader({ title, text }: { title: string; text: string }) {
  return (
    <div className="panel-header">
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="field-block">
      <span>
        {label}
        {required && <em>Required</em>}
      </span>
      {children}
    </label>
  );
}
