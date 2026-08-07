# blihops-api

Express backend for blihops.

## Stack

- Express
- TypeScript (strict)
- Prisma (ORM, driver adapters)
- PostgreSQL (Docker for local dev)
- zod (validation)
- pino (logging)
- Vitest + supertest + testcontainers (testing)
- pnpm

## Requirements

- Node.js 24.18+
- pnpm 11.17.0
- Docker (for the local database and integration tests)
- Git

## Setup

```bash
git clone https://github.com/blihops/blihops-api.git
cd blihops-api

npm install --global corepack@latest
corepack enable pnpm

docker compose up -d db
pnpm install
cp .env.example .env
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Open http://localhost:4000/health.

## Commands

| Command                       | Purpose                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| `pnpm dev`                    | Start development (tsx watch)                                                                 |
| `pnpm build`                  | Compile TypeScript to `dist/` (runs `prisma generate` first)                                  |
| `pnpm start`                  | Run compiled production build                                                                 |
| `pnpm lint`                   | Run ESLint                                                                                    |
| `pnpm typecheck`              | Run TypeScript checking                                                                       |
| `pnpm format`                 | Format files with Prettier                                                                    |
| `pnpm format:check`           | Check formatting without writing                                                              |
| `pnpm test`                   | Run the unit test suite once (no Docker required)                                             |
| `pnpm test:watch`             | Run unit tests in watch mode                                                                  |
| `pnpm test:integration`       | Run the integration suite (spins up a Postgres container via testcontainers; requires Docker) |
| `pnpm test:integration:watch` | Run integration tests in watch mode (requires Docker)                                         |
| `pnpm test:all`               | Run unit + integration suites (requires Docker)                                               |
| `pnpm check`                  | Run all quality checks (lint + typecheck + format:check + build)                              |
| `pnpm db:up`                  | Start the local Postgres container                                                            |
| `pnpm db:down`                | Stop the local Postgres container                                                             |
| `pnpm db:reset`               | Stop the container and wipe its data volume                                                   |
| `pnpm db:generate`            | Generate the Prisma client into `src/generated/`                                              |
| `pnpm db:migrate`             | Create and apply a dev migration (`prisma migrate dev`)                                       |
| `pnpm db:deploy`              | Apply committed migrations (`prisma migrate deploy`)                                          |
| `pnpm db:studio`              | Open Prisma Studio                                                                            |

## Environment

Copy `.env.example` to `.env` and fill in real values. Never commit `.env` or
any other `.env*` file.

| Variable       | Description                                          |
| -------------- | ---------------------------------------------------- |
| `NODE_ENV`     | `development` \| `test` \| `production`              |
| `PORT`         | HTTP listen port (default 4000)                      |
| `API_URL`      | Base URL the API exposes itself at                   |
| `DATABASE_URL` | Postgres connection string (local Docker by default) |
| `JWT_SECRET`   | Secret for signing JWTs                              |
| `CORS_ORIGIN`  | Comma-separated allowed origins                      |

The local Postgres from `docker compose` uses
`postgresql://blihops:blihops@localhost:5432/blihops`. The generated Prisma
client in `src/generated/` is git-ignored and recreated by `pnpm db:generate`.

## Repository structure

```
src/
  app.ts           # Express app instance + routes
  server.ts        # Entry point - env + listen
tests/
  setup/           # Shared test bootstrap (env, testcontainers global setup, db reset)
  unit/            # Fast unit tests (no Docker)
  integration/     # DB-backed tests via testcontainers (Docker)
.github/
  workflows/ci.yml
  CODEOWNERS
  PULL_REQUEST_TEMPLATE.md
.husky/            # pre-commit, commit-msg, pre-push hooks
```

## Contributing

Read CONTRIBUTING.md.
