import { useEffect, useMemo, useState } from 'react';
import type {
  ApplicationItem,
  ApplicationStage,
  CandidateProfile,
  CandidateType,
  DocumentType,
  GeneratedDocument,
  InterviewFeedback,
  InterviewType,
  JobMatchResult,
  LanguageMode,
} from './types/shukatsu';
import {
  analyzeJobMatch,
  createWeeklyActionPlan,
  evaluateInterviewAnswer,
  generateDocument,
  getInterviewQuestion,
} from './services/shukatsuAgent';

type Page = 'home' | 'match' | 'documents' | 'interview' | 'tracker';

const STORAGE_KEY = 'shukatsu_copilot_tracker';

const initialProfile: CandidateProfile = {
  id: 'demo-profile',
  currentRole: 'Overseas project coordinator',
  currentIndustry: 'Technology / Education',
  yearsOfExperience: '3 years',
  languages: ['Chinese', 'English', 'Japanese N2'],
  targetRole: 'AI Product Planner / Solution Consultant',
  targetIndustry: 'Japan IT / SaaS',
  candidateType: 'career_change',
};

const sampleResume = `English / Chinese resume draft:
- Coordinated cross-border AI learning product projects.
- Worked with customers, designers, and engineers to clarify requirements.
- Improved onboarding materials and reduced repeated customer questions.
- Languages: Chinese native, English business, Japanese N2.`;

const sampleJob = `求人票 / JD:
AIプロダクト企画・ソリューションコンサルタント
仕事内容: 顧客課題のヒアリング、AI活用提案、要件定義、社内エンジニアとの仕様調整、導入後の活用支援。
必須: 日本語での顧客折衝、BtoBプロジェクト推進、業務改善への関心。
歓迎: AI / SaaS / DX推進経験、多文化環境での業務経験。`;

const stageOptions: ApplicationStage[] = ['気になる', '書類準備中', '応募済み', '書類選考中', '一次面接', '二次面接', '最終面接', '内定', '不合格'];

const documentLabels: Record<DocumentType, string> = {
  career_summary: '職務要約',
  self_pr: '自己PR',
  motivation: '志望動機',
  career_change_reason: '転職理由',
  gakuchika: 'ガクチカ',
  one_minute_intro: '面接用 1分自己紹介',
  reverse_questions: '逆質問',
  contribution: '入社後に貢献できること',
};

const languageLabels: Record<LanguageMode, string> = {
  n2_friendly: 'N2 Friendly',
  business: 'Business Japanese',
  interview: 'Interview Speaking',
  furigana: 'Furigana Support',
};

const interviewLabels: Record<InterviewType, string> = {
  new_grad: '新卒面接',
  career_change: '転職面接',
  second_new_grad: '第二新卒面接',
  inexperienced_role: '未経験職種面接',
  final: '最終面接',
};

const candidateTypeLabels: Record<CandidateType, string> = {
  new_grad: 'New Grad / 留学生',
  second_new_grad: 'Second New Grad',
  career_change: 'Career Change',
  experienced: 'Experienced',
  unknown: 'Not Sure Yet',
};

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [profile, setProfile] = useState<CandidateProfile>(initialProfile);
  const [resumeText, setResumeText] = useState(sampleResume);
  const [jobText, setJobText] = useState(sampleJob);
  const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([]);
  const [matchResult, setMatchResult] = useState<JobMatchResult | null>(null);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('motivation');
  const [languageMode, setLanguageMode] = useState<LanguageMode>('business');
  const [extraInfo, setExtraInfo] = useState('I want to challenge myself in Japan and use my overseas project experience.');
  const [interviewType, setInterviewType] = useState<InterviewType>('career_change');
  const [interviewRole, setInterviewRole] = useState(profile.targetRole);
  const [interviewAnswer, setInterviewAnswer] = useState('御社のAIサービスに興味があります。前職で顧客対応を頑張りました。日本でチャレンジしたいです。');
  const [interviewFeedback, setInterviewFeedback] = useState<InterviewFeedback | null>(null);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setApplications(JSON.parse(raw));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
  }, [applications]);

  const currentQuestion = useMemo(() => getInterviewQuestion(interviewType, interviewRole), [interviewType, interviewRole]);
  const actionPlan = useMemo(() => createWeeklyActionPlan(applications.length), [applications.length]);

  const copyText = async (text: string, label = 'Text') => {
    await navigator.clipboard.writeText(text);
    setCopied(`${label} copied`);
    setTimeout(() => setCopied(''), 1800);
  };

  const runMatch = async () => {
    setError('');
    setLoading('match');
    try {
      setMatchResult(await analyzeJobMatch({ profile, resumeText, jobText, uploadedFileNames }));
    } catch {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const runDocument = async () => {
    setError('');
    setLoading('document');
    try {
      const doc = await generateDocument({ type: selectedDocType, languageMode, resumeText, jobText, extraInfo, matchResult });
      setDocuments((prev) => [doc, ...prev]);
    } catch {
      setError('Document generation failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const runInterviewFeedback = async () => {
    setError('');
    setLoading('interview');
    try {
      setInterviewFeedback(await evaluateInterviewAnswer(interviewAnswer));
    } catch {
      setError('Interview feedback failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const addApplication = () => {
    const item: ApplicationItem = {
      id: crypto.randomUUID(),
      companyName: 'Demo AI Japan',
      roleName: profile.targetRole || 'AI Product Planner',
      stage: '書類準備中',
      nextAction: '志望動機を応募企業向けに調整する',
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10),
      memo: 'Saved from Shukatsu Copilot demo flow.',
      linkedDocuments: documents.slice(0, 3).map((doc) => documentLabels[doc.type]),
      linkedInterviewNotes: interviewFeedback ? ['Mock interview feedback saved'] : [],
      createdAt: new Date().toISOString(),
    };
    setApplications((prev) => [item, ...prev]);
    setPage('tracker');
  };

  const updateApplication = (id: string, patch: Partial<ApplicationItem>) => {
    setApplications((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const deleteApplication = (id: string) => {
    setApplications((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setPage('home')}>
          <span className="brand-mark">SC</span>
          <span>
            <strong>Shukatsu Copilot</strong>
            <small>Japan Career Agent for Global Talent</small>
          </span>
        </button>
        <nav className="nav-tabs">
          {(['home', 'match', 'documents', 'interview', 'tracker'] as Page[]).map((item) => (
            <button key={item} className={page === item ? 'active' : ''} onClick={() => setPage(item)}>
              {item === 'home' && 'Home'}
              {item === 'match' && 'Job Match'}
              {item === 'documents' && 'Documents'}
              {item === 'interview' && 'Mock Interview'}
              {item === 'tracker' && 'Tracker'}
            </button>
          ))}
        </nav>
      </header>

      {copied && <div className="toast">{copied}</div>}
      {error && <div className="error-banner">{error}</div>}

      <main>
        {page === 'home' && <HomePage onStart={() => setPage('match')} onInterview={() => setPage('interview')} matchResult={matchResult} documents={documents.length} applications={applications.length} />}
        {page === 'match' && <JobMatchPage profile={profile} setProfile={setProfile} resumeText={resumeText} setResumeText={setResumeText} jobText={jobText} setJobText={setJobText} uploadedFileNames={uploadedFileNames} setUploadedFileNames={setUploadedFileNames} matchResult={matchResult} onAnalyze={runMatch} onGenerateDocs={() => setPage('documents')} onSave={addApplication} loading={loading === 'match'} copyText={copyText} />}
        {page === 'documents' && <DocumentPage selectedDocType={selectedDocType} setSelectedDocType={setSelectedDocType} languageMode={languageMode} setLanguageMode={setLanguageMode} extraInfo={extraInfo} setExtraInfo={setExtraInfo} documents={documents} onGenerate={runDocument} loading={loading === 'document'} copyText={copyText} />}
        {page === 'interview' && <InterviewPage interviewType={interviewType} setInterviewType={setInterviewType} interviewRole={interviewRole} setInterviewRole={setInterviewRole} currentQuestion={currentQuestion} interviewAnswer={interviewAnswer} setInterviewAnswer={setInterviewAnswer} feedback={interviewFeedback} onEvaluate={runInterviewFeedback} loading={loading === 'interview'} copyText={copyText} />}
        {page === 'tracker' && <TrackerPage applications={applications} updateApplication={updateApplication} deleteApplication={deleteApplication} addApplication={addApplication} actionPlan={actionPlan} />}
      </main>
    </div>
  );
}

function HomePage({ onStart, onInterview, matchResult, documents, applications }: {
  onStart: () => void;
  onInterview: () => void;
  matchResult: JobMatchResult | null;
  documents: number;
  applications: number;
}) {
  return (
    <section className="hero-grid">
      <div className="hero-copy">
        <p className="eyebrow">For international candidates applying in Japan</p>
        <h1>Shukatsu Copilot</h1>
        <p className="subtitle">Japan Career Agent for Global Talent</p>
        <p className="hero-text">
          Upload your resume and a Japanese job posting. Shukatsu Copilot localizes your experience into Japan-style application documents, interview answers, and a personalized job-hunting plan.
        </p>
        <p className="cn-note">面向外国求职者，把中文/英文经历转化成日企能理解的履歴書、職務経歴書、自己PR、志望動機和面试表达。</p>
        <div className="hero-actions">
          <button className="primary-btn" onClick={onStart}>Start Job Match</button>
          <button className="secondary-btn" onClick={onInterview}>Practice Interview</button>
        </div>
      </div>
      <div className="demo-panel">
        <div className="panel-header">
          <span>3 minute demo flow</span>
          <strong>{matchResult ? `${matchResult.matchScore}/100` : 'Ready'}</strong>
        </div>
        {['Resume + JD analysis', 'Japan-style documents', 'Japanese mock interview', 'Application tracker'].map((item, index) => (
          <div className="flow-row" key={item}>
            <span>{index + 1}</span>
            <p>{item}</p>
          </div>
        ))}
        <div className="mini-metrics">
          <div><strong>{documents}</strong><span>Generated docs</span></div>
          <div><strong>{applications}</strong><span>Tracked roles</span></div>
        </div>
      </div>
      <div className="feature-grid">
        <FeatureCard title="Resume & JD Matching" text="Understand Japanese JD requirements, risks, and transferable skills." />
        <FeatureCard title="Japan-style Document Generation" text="Create 自己PR, 志望動機, 職務要約, 逆質問 and interview scripts." />
        <FeatureCard title="Japanese Mock Interview" text="Practice keigo, logic, culture fit, and follow-up questions." />
        <FeatureCard title="Application Tracker" text="Manage stages, deadlines, next actions, and weekly preparation tasks." />
      </div>
    </section>
  );
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="feature-card">
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function JobMatchPage(props: {
  profile: CandidateProfile;
  setProfile: (profile: CandidateProfile) => void;
  resumeText: string;
  setResumeText: (value: string) => void;
  jobText: string;
  setJobText: (value: string) => void;
  uploadedFileNames: string[];
  setUploadedFileNames: (value: string[]) => void;
  matchResult: JobMatchResult | null;
  onAnalyze: () => void;
  onGenerateDocs: () => void;
  onSave: () => void;
  loading: boolean;
  copyText: (text: string, label?: string) => void;
}) {
  const { profile, setProfile } = props;
  return (
    <section className="page-stack">
      <PageTitle title="Job Match" text="Analyze a multilingual resume against a Japanese job posting, screenshot, or JD." />
      <div className="two-column">
        <div className="card input-card">
          <h2>Candidate Background</h2>
          <div className="form-grid">
            <label>Current role<input value={profile.currentRole} onChange={(e) => setProfile({ ...profile, currentRole: e.target.value })} /></label>
            <label>Current industry<input value={profile.currentIndustry} onChange={(e) => setProfile({ ...profile, currentIndustry: e.target.value })} /></label>
            <label>Experience<input value={profile.yearsOfExperience} onChange={(e) => setProfile({ ...profile, yearsOfExperience: e.target.value })} /></label>
            <label>Target role<input value={profile.targetRole} onChange={(e) => setProfile({ ...profile, targetRole: e.target.value })} /></label>
            <label>Target industry<input value={profile.targetIndustry} onChange={(e) => setProfile({ ...profile, targetIndustry: e.target.value })} /></label>
            <label>Candidate type
              <select value={profile.candidateType} onChange={(e) => setProfile({ ...profile, candidateType: e.target.value as CandidateType })}>
                {Object.entries(candidateTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>
          <label>Languages<input value={profile.languages.join(', ')} onChange={(e) => setProfile({ ...profile, languages: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} /></label>
        </div>
        <div className="card privacy-card">
          <h2>Upload preview</h2>
          <p>MVP reads text input and records file names for demo. For production, upload files to encrypted Cloud Storage and process with Gemini multimodal APIs.</p>
          <input type="file" multiple accept="image/*,.pdf" onChange={(e) => props.setUploadedFileNames(Array.from(e.target.files || []).map((file) => file.name))} />
          <div className="chip-list">
            {props.uploadedFileNames.length ? props.uploadedFileNames.map((name) => <span key={name}>{name}</span>) : <span>No files selected</span>}
          </div>
        </div>
      </div>

      <div className="two-column">
        <label className="card text-area-card">Resume Input<textarea value={props.resumeText} onChange={(e) => props.setResumeText(e.target.value)} /></label>
        <label className="card text-area-card">Job Posting / JD Input<textarea value={props.jobText} onChange={(e) => props.setJobText(e.target.value)} /></label>
      </div>
      <div className="action-row">
        <button className="primary-btn" onClick={props.onAnalyze} disabled={props.loading}>{props.loading ? 'Analyzing...' : 'Analyze Match'}</button>
        {props.matchResult && <button className="secondary-btn" onClick={props.onGenerateDocs}>Generate Documents</button>}
        {props.matchResult && <button className="ghost-btn" onClick={props.onSave}>Save to Tracker</button>}
      </div>
      {props.matchResult && <MatchResultView result={props.matchResult} copyText={props.copyText} />}
    </section>
  );
}

function MatchResultView({ result, copyText }: { result: JobMatchResult; copyText: (text: string, label?: string) => void }) {
  return (
    <div className="result-grid">
      <div className="score-card">
        <span>Match Score</span>
        <strong>{result.matchScore}</strong>
        <small>/100</small>
      </div>
      <div className="card wide">
        <div className="card-title-row"><h2>Application Strategy</h2><button onClick={() => copyText(result.applicationStrategy.join('\n'), 'Strategy')}>Copy</button></div>
        <p><strong>Job:</strong> {result.jobSummary}</p>
        <p><strong>Candidate:</strong> {result.candidateSummary}</p>
      </div>
      <ListCard title="Strong matches" items={result.strongMatches} />
      <ListCard title="Transferable skills" items={result.transferableSkills} />
      <ListCard title="Risk points" items={result.riskPoints} tone="warning" />
      <ListCard title="Missing information" items={result.missingInfo} tone="warning" />
      <ListCard title="Strategy" items={result.applicationStrategy} />
      <ListCard title="Recommended keywords" items={result.recommendedKeywords} chips />
    </div>
  );
}

function DocumentPage(props: {
  selectedDocType: DocumentType;
  setSelectedDocType: (value: DocumentType) => void;
  languageMode: LanguageMode;
  setLanguageMode: (value: LanguageMode) => void;
  extraInfo: string;
  setExtraInfo: (value: string) => void;
  documents: GeneratedDocument[];
  onGenerate: () => void;
  loading: boolean;
  copyText: (text: string, label?: string) => void;
}) {
  return (
    <section className="page-stack">
      <PageTitle title="Document Generator" text="Generate localized Japan-style application materials, not direct translations." />
      <div className="two-column">
        <div className="card input-card">
          <h2>Generation Settings</h2>
          <label>Material type
            <select value={props.selectedDocType} onChange={(e) => props.setSelectedDocType(e.target.value as DocumentType)}>
              {Object.entries(documentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>Japanese mode
            <select value={props.languageMode} onChange={(e) => props.setLanguageMode(e.target.value as LanguageMode)}>
              {Object.entries(languageLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>Extra notes<textarea className="short-textarea" value={props.extraInfo} onChange={(e) => props.setExtraInfo(e.target.value)} /></label>
          <button className="primary-btn" onClick={props.onGenerate} disabled={props.loading}>{props.loading ? 'Generating...' : 'Generate Japan-style Material'}</button>
        </div>
        <div className="card">
          <h2>Mode guide</h2>
          <div className="mode-list">
            <p><strong>N2 Friendly</strong><span>Simple, natural, easier for non-native candidates to say.</span></p>
            <p><strong>Business Japanese</strong><span>Formal tone for 職務経歴書 and 志望動機.</span></p>
            <p><strong>Interview Speaking</strong><span>Shorter sentences for spoken answers.</span></p>
            <p><strong>Furigana Support</strong><span>Adds kana to difficult terms for reading practice.</span></p>
          </div>
        </div>
      </div>
      <div className="document-list">
        {props.documents.length === 0 && <EmptyState text="Generate a document to see localized Japanese output here." />}
        {props.documents.map((doc) => (
          <article className="card document-card" key={doc.id}>
            <div className="card-title-row">
              <div><h2>{documentLabels[doc.type]}</h2><span>{languageLabels[doc.languageMode]} · {new Date(doc.createdAt).toLocaleString()}</span></div>
              <button onClick={() => props.copyText(doc.content, documentLabels[doc.type])}>Copy</button>
            </div>
            <pre>{doc.content}</pre>
            <p className="explanation">{doc.explanation}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function InterviewPage(props: {
  interviewType: InterviewType;
  setInterviewType: (value: InterviewType) => void;
  interviewRole: string;
  setInterviewRole: (value: string) => void;
  currentQuestion: string;
  interviewAnswer: string;
  setInterviewAnswer: (value: string) => void;
  feedback: InterviewFeedback | null;
  onEvaluate: () => void;
  loading: boolean;
  copyText: (text: string, label?: string) => void;
}) {
  return (
    <section className="page-stack">
      <PageTitle title="Mock Interview" text="Practice Japanese interview answers with keigo, structure, and culture-fit feedback." />
      <div className="two-column">
        <div className="card input-card">
          <h2>Interview Setup</h2>
          <label>Target role<input value={props.interviewRole} onChange={(e) => props.setInterviewRole(e.target.value)} /></label>
          <label>Interview type
            <select value={props.interviewType} onChange={(e) => props.setInterviewType(e.target.value as InterviewType)}>
              {Object.entries(interviewLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <div className="interviewer-card">
            <span>面接官</span>
            <p>{props.currentQuestion}</p>
          </div>
        </div>
        <label className="card text-area-card">Your Answer<textarea value={props.interviewAnswer} onChange={(e) => props.setInterviewAnswer(e.target.value)} /></label>
      </div>
      <div className="action-row">
        <button className="primary-btn" onClick={props.onEvaluate} disabled={props.loading}>{props.loading ? 'Reviewing...' : 'Get Interview Feedback'}</button>
      </div>
      {props.feedback && (
        <div className="result-grid">
          <ScoreMini label="Content" value={props.feedback.contentScore} />
          <ScoreMini label="Business JP" value={props.feedback.businessJapaneseScore} />
          <ScoreMini label="Structure" value={props.feedback.structureScore} />
          <ScoreMini label="Naturalness" value={props.feedback.naturalnessScore} />
          <ScoreMini label="Culture Fit" value={props.feedback.culturalFitScore} />
          <ListCard title="Feedback" items={props.feedback.feedback} />
          <div className="card wide">
            <div className="card-title-row"><h2>Better Answer</h2><button onClick={() => props.copyText(props.feedback!.improvedAnswer, 'Improved answer')}>Copy</button></div>
            <p>{props.feedback.improvedAnswer}</p>
          </div>
          <div className="card">
            <h2>Keigo and expression fixes</h2>
            {props.feedback.politeExpressionFixes.map((fix) => (
              <div className="fix-row" key={fix.original}>
                <strong>{fix.original}</strong>
                <span>{fix.better}</span>
                <p>{fix.reason}</p>
              </div>
            ))}
          </div>
          <ListCard title="Likely follow-up questions" items={props.feedback.followUpQuestions} />
        </div>
      )}
    </section>
  );
}

function TrackerPage(props: {
  applications: ApplicationItem[];
  updateApplication: (id: string, patch: Partial<ApplicationItem>) => void;
  deleteApplication: (id: string) => void;
  addApplication: () => void;
  actionPlan: string[];
}) {
  return (
    <section className="page-stack">
      <PageTitle title="Application Tracker" text="Track stages, next actions, deadlines, generated documents, and interview practice." />
      <div className="action-row"><button className="primary-btn" onClick={props.addApplication}>Add Demo Application</button></div>
      <div className="card">
        <h2>This week's action plan</h2>
        <ol className="number-list">{props.actionPlan.map((item) => <li key={item}>{item}</li>)}</ol>
      </div>
      <div className="tracker-table card">
        <div className="table-row table-head"><span>Company</span><span>Role</span><span>Stage</span><span>Next Action</span><span>Deadline</span><span></span></div>
        {props.applications.length === 0 && <EmptyState text="No applications yet. Save a target role from Job Match or add a demo application." />}
        {props.applications.map((item) => (
          <div className="table-row" key={item.id}>
            <input value={item.companyName} onChange={(e) => props.updateApplication(item.id, { companyName: e.target.value })} />
            <input value={item.roleName} onChange={(e) => props.updateApplication(item.id, { roleName: e.target.value })} />
            <select value={item.stage} onChange={(e) => props.updateApplication(item.id, { stage: e.target.value as ApplicationStage })}>
              {stageOptions.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
            </select>
            <input value={item.nextAction} onChange={(e) => props.updateApplication(item.id, { nextAction: e.target.value })} />
            <input type="date" value={item.deadline} onChange={(e) => props.updateApplication(item.id, { deadline: e.target.value })} />
            <button className="danger-btn" onClick={() => props.deleteApplication(item.id)}>Delete</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function PageTitle({ title, text }: { title: string; text: string }) {
  return (
    <div className="page-title">
      <p className="eyebrow">Japan Career Agent</p>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}

function ListCard({ title, items, tone, chips }: { title: string; items: string[]; tone?: 'warning'; chips?: boolean }) {
  return (
    <div className={`card list-card ${tone || ''}`}>
      <h2>{title}</h2>
      <div className={chips ? 'chip-list' : 'plain-list'}>
        {items.map((item) => chips ? <span key={item}>{item}</span> : <p key={item}>{item}</p>)}
      </div>
    </div>
  );
}

function ScoreMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-mini">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>/10</small>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}
