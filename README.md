# RekaResume AI

AI resume rewrite and career matching assistant built with React, TypeScript, and Vite.

## Features

- Candidate type presets for new grads, second new grads, career changers, cross-industry moves, and undecided users
- Resume and career matching analysis
- Before/after rewrite suggestions
- Editable optimized resume sections
- Usage language switcher for Chinese, English, and Japanese
- Demo mode without an API key
- Optional Gemini API mode

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The static site is generated in `dist`.

## Deploy

This repository includes a GitHub Pages workflow at `.github/workflows/deploy-pages.yml`.

After pushing to GitHub:

1. Open the repository on GitHub.
2. Go to `Settings` > `Pages`.
3. Set `Source` to `GitHub Actions`.
4. Push to the `main` branch or run the workflow manually.
