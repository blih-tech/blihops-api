# blihops-api

Express backend for blihops.

## Stack

- Express
- TypeScript (strict)
- zod (validation)
- pino (logging)
- Vitest + supertest + testcontainers (testing)
- pnpm

## Requirements

- Node.js 24.18+
- pnpm 11.17.0
- Git

## Setup

```bash
git clone https://github.com/blihops/blihops-api.git
cd blihops-api

npm install --global corepack@latest
corepack enable pnpm

pnpm install
cp .env.example .env.local
pnpm dev
```

Open http://localhost:4000/health.

## Commands

| Command             | Purpose                                                          |
| ------------------- | ---------------------------------------------------------------- |
| `pnpm dev`          | Start development (tsx watch)                                    |
| `pnpm build`        | Compile TypeScript to `dist/`                                    |
| `pnpm start`        | Run compiled production build                                    |
| `pnpm lint`         | Run ESLint                                                       |
| `pnpm typecheck`    | Run TypeScript checking                                          |
| `pnpm format`       | Format files with Prettier                                       |
| `pnpm format:check` | Check formatting without writing                                 |
| `pnpm test`         | Run Vitest suite once                                            |
| `pnpm test:watch`   | Run Vitest in watch mode                                         |
| `pnpm check`        | Run all quality checks (lint + typecheck + format:check + build) |

## Environment

Copy `.env.example` to `.env.local` and fill in real values. Never commit
`.env.local` or any other `.env*` file.

| Variable       | Description                             |
| -------------- | --------------------------------------- |
| `NODE_ENV`     | `development` \| `test` \| `production` |
| `PORT`         | HTTP listen port (default 4000)         |
| `API_URL`      | Base URL the API exposes itself at      |
| `DATABASE_URL` | Postgres connection string              |
| `JWT_SECRET`   | Secret for signing JWTs                 |
| `CORS_ORIGIN`  | Comma-separated allowed origins         |

## Repository structure

```
src/
  app.ts           # Express app instance + routes
  server.ts        # Entry point - env + listen
tests/
  *.test.ts
.github/
  workflows/ci.yml
  CODEOWNERS
  PULL_REQUEST_TEMPLATE.md
.husky/            # pre-commit, commit-msg, pre-push hooks
```

## Contributing

Read CONTRIBUTING.md.
