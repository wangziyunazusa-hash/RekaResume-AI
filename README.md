# Shukatsu Copilot

Japan Career Agent for Global Talent.

Shukatsu Copilot is a Gemini Hackathon MVP that helps international candidates navigate Japan's job-hunting process: resume/JD matching, Japan-style document generation, Japanese mock interview feedback, and application tracking.

## Product Scope

- Resume and Japanese JD matching analysis
- Japan-style document generation: 職務要約, 自己PR, 志望動機, 転職理由, ガクチカ, 1分自己紹介, 逆質問
- Japanese language modes: N2 Friendly, Business Japanese, Interview Speaking, Furigana Support
- Mock interview coach with scores, keigo fixes, improved answers, and follow-up questions
- Application tracker with stages, deadlines, next actions, and weekly action plan
- MVP localStorage persistence for tracker data
- Mock Gemini services that produce realistic demo responses without an API key

## Demo Flow

1. Open Home and click `Start Job Match`.
2. Review or replace the sample multilingual resume and Japanese JD.
3. Click `Analyze Match`.
4. Go to `Documents` and generate 志望動機 or 1分自己紹介.
5. Go to `Mock Interview`, answer the Japanese interviewer question, and get feedback.
6. Save the role to `Tracker` and review this week's action plan.

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The static site is generated in `dist`.

## Environment Variables

Copy `.env.example` to `.env.local` when adding real Gemini / Google Cloud services.

```bash
cp .env.example .env.local
```

For the current static MVP, no API key is required because `src/services/shukatsuAgent.ts` uses mock responses.

## Gemini Integration Plan

Centralized prompt files live in:

- `src/lib/prompts/jobMatchPrompt.ts`
- `src/lib/prompts/documentGeneratePrompt.ts`
- `src/lib/prompts/interviewPrompt.ts`
- `src/lib/prompts/actionPlanPrompt.ts`

To connect Gemini:

1. Move API calls to a backend boundary such as Cloud Run or Next.js API routes.
2. Keep `GEMINI_API_KEY` server-side only.
3. Send resume/JD text plus uploaded image or PDF references to Gemini multimodal APIs.
4. Validate JSON responses before rendering.
5. Never log full resumes or personal documents.

## Google Cloud Production Plan

- Cloud Run: host the API service that calls Gemini.
- Cloud Storage: store uploaded resumes, JD screenshots, and PDFs with signed URLs.
- Firestore: store tracker records, generated document history, and interview practice history.
- Secret Manager: store Gemini and service credentials.
- Identity / auth: add user login before storing personal job-search data.

## Privacy Notes

Job-search documents may contain personal data. The MVP uses browser localStorage only for tracker records. Production should use authenticated encrypted storage, short-lived upload URLs, and clear retention controls. This product helps candidates prepare honestly; it does not automate spam applications or fabricate experience.

## GitHub Pages Deployment

This repository includes `.github/workflows/deploy-pages.yml`.

1. In GitHub, open `Settings > Pages`.
2. Set `Source` to `GitHub Actions`.
3. Push to `main` or run the workflow manually.
