# RekaResume AI

Managed AI Agent for Japan Job Application Documents.

RekaResume AI helps international candidates improve Japan-style application documents step by step:

1. Understand the candidate's current experience.
2. Understand the target Japanese job posting.
3. Review the original 自己PR / 志望動機 / 職務要約 / 職務経歴 text.
4. Return improved Japanese text, revision reasons, and next actions.

The UI is intentionally simple: a guided workflow focused on 応募書類添削.

## Gemini Managed Agent Architecture

The main agent is `ResumeReviewManagedAgent`.

Agent goal:

> Based on the candidate background, target job posting, and original application document, produce Japan-ready application text with clear analysis and revision explanations.

Managed subtasks:

- Candidate Understanding
- Job Understanding
- Gap Analysis
- Japanese Localization
- Explanation Generation
- Output Structuring

Core files:

- `src/lib/agents/types.ts`
- `src/lib/agents/resumeReviewAgent.ts`
- `src/lib/gemini/client.ts`
- `src/lib/gemini/prompts.ts`
- `src/lib/gemini/schemas.ts`
- `src/app/api/agent/resume-review/route.ts`

## API Route

Equivalent API route:

```http
POST /api/agent/resume-review
```

Request body:

```ts
ResumeReviewAgentInput
```

Response body:

```ts
ResumeReviewAgentOutput
```

The current GitHub Pages deployment is static, so the frontend attempts the API call and then falls back to the local mock Managed Agent when the API route is unavailable. On Cloud Run, Next.js, or another server runtime, this route can call Gemini server-side.

## Environment Variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Set:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

Important: `GEMINI_API_KEY` must stay server-side. Do not expose it in browser code.

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Mock Fallback

If `GEMINI_API_KEY` is missing or the static deployment cannot reach `/api/agent/resume-review`, the app uses a realistic mock fallback in:

```text
src/lib/agents/resumeReviewAgent.ts
```

This keeps the demo usable while preserving a production-ready Managed Agent boundary.

## Google Cloud / Production Plan

- Cloud Run: host the API service that calls Gemini.
- Secret Manager: store `GEMINI_API_KEY`.
- Cloud Storage: store uploaded resumes, JD screenshots, and PDFs using signed URLs.
- Firestore: store authenticated user history, generated documents, and tracker records.
- Authentication: add user accounts before storing personal job-search data.

## Privacy Notes

Job-search documents can contain personal information.

- Do not log full resumes or application documents.
- Do not hardcode API keys.
- Keep Gemini calls on the server.
- The current MVP uses localStorage only for saved review history.
- Production should use authenticated, encrypted storage.
- The product helps candidates prepare honest applications; it does not automate spam applications or fabricate experience.

## GitHub Pages Deployment

This repository includes `.github/workflows/deploy-pages.yml`.

1. In GitHub, open `Settings > Pages`.
2. Set `Source` to `GitHub Actions`.
3. Push to `main` or run the workflow manually.
