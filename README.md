# blihops-api

Express backend for blihops. Provides authentication (better-auth email/password
with admin invites), session token mirroring, transactional email (Resend), and
the managed website content API for the web and admin frontends.

## Stack

- Express
- TypeScript (strict)
- Prisma (ORM, driver adapters)
- PostgreSQL (Docker for local dev; Neon in production)
- better-auth (auth: sign-in, invites, password reset, role-based access)
- Resend (transactional email: invite + reset templates with brand logo)
- zod (validation + OpenAPI)
- sanitize-html (server-side HTML sanitization of rich-text content)
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

| Command                       | Purpose                                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- |
| `pnpm dev`                    | Start development (tsx watch)                                                                        |
| `pnpm build`                  | Compile TypeScript to `dist/` (runs `prisma generate` first)                                         |
| `pnpm start`                  | Run compiled production build                                                                        |
| `pnpm lint`                   | Run ESLint                                                                                           |
| `pnpm typecheck`              | Run TypeScript checking                                                                              |
| `pnpm format`                 | Format files with Prettier                                                                           |
| `pnpm format:check`           | Check formatting without writing                                                                     |
| `pnpm test`                   | Run the unit test suite once (no Docker required)                                                    |
| `pnpm test:watch`             | Run unit tests in watch mode                                                                         |
| `pnpm test:integration`       | Run the integration suite (spins up a Postgres container via testcontainers; requires Docker)        |
| `pnpm test:integration:watch` | Run integration tests in watch mode (requires Docker)                                                |
| `pnpm test:all`               | Run unit + integration suites (requires Docker)                                                      |
| `pnpm check`                  | Run all quality checks (lint + typecheck + format:check + audit + build + test:all; requires Docker) |
| `pnpm db:up`                  | Start the local Postgres container                                                                   |
| `pnpm db:down`                | Stop the local Postgres container                                                                    |
| `pnpm db:reset`               | Stop the container and wipe its data volume                                                          |
| `pnpm db:generate`            | Generate the Prisma client into `src/generated/`                                                     |
| `pnpm db:migrate`             | Create and apply a dev migration (`prisma migrate dev`)                                              |
| `pnpm db:deploy`              | Apply committed migrations (`prisma migrate deploy`)                                                 |
| `pnpm db:studio`              | Open Prisma Studio                                                                                   |
| `pnpm seed:admin`             | Create the initial admin (requires `SEED_ADMIN_PASSWORD`)                                            |
| `pnpm seed:demo`              | Create demo client + talent users (requires `SEED_DEMO_PASSWORD`)                                    |

## API surface

### Authentication (`/api/v1/auth`)

Sign-in, sign-out, password reset, admin invitations, and session token
mirroring via better-auth. Admin, Client, and Talent roles are enforced by
middleware (`requireAuth` + `requireRole`).

### Managed website content (`/api/v1/content`)

Nine resources back the CMS for the web and admin frontends:

| Resource      | Public route(s)                               | Admin routes (`/api/v1/content/admin/...`) |
| ------------- | --------------------------------------------- | ------------------------------------------ |
| Tags          | `GET /content/tags`                           | `tags`                                     |
| Categories    | `GET /content/categories`                     | `categories`                               |
| Trusted Logos | `GET /content/logos`                          | `logos`                                    |
| Testimonials  | `GET /content/testimonials`                   | `testimonials`                             |
| Services hero | `GET /content/services-hero`                  | `services-hero`                            |
| Case Studies  | `GET /content/case-studies` · `GET .../:slug` | `case-studies` (+ publish/unpublish)       |
| Insights      | `GET /content/insights` · `GET .../:slug`     | `insights` (+ publish/unpublish)           |
| Career Roles  | `GET /content/careers` · `GET .../:slug`      | `careers`                                  |
| Pilot FAQs    | `GET /content/faqs`                           | `faqs`                                     |

Conventions:

- Public routes are unauthenticated GETs returning only published/active
  content, with cache headers (`public, max-age=300, stale-while-revalidate`).
- Every admin route lives under the single `/admin` subtree, guarded once by
  `requireAuth` + `requireRole('admin')`.
- Single-resource responses use `{ data }`; lists use `{ items, meta }`.
- Bilingual resources (case studies, insights, FAQs) return both locales; the
  web selects by its active locale.
- Rich-text bodies are sanitized server-side with `sanitize-html`.
- Content-specific error codes: `CONTENT_INCOMPLETE` (422), `CONTENT_SLUG_TAKEN`
  (409), `CONTENT_PRIMARY_DELETE_BLOCKED` (409), `CONTENT_INVALID_LOCALE` (400).

Detailed API design lives in `blihops-design/03-Engineering/features/content/`.

### OpenAPI / Swagger

An OpenAPI 3.1 document is generated from the registered schemas and paths. In
non-production environments it is served at:

- Swagger UI: `http://localhost:4000/api/v1/docs`
- Raw JSON: `http://localhost:4000/api/v1/openapi.json`

## Production schema changes

Production runs on Render's free tier, which has **no pre-deploy command** — so
schema changes are migrated manually from your machine **before** merging into
`main`. The deployed API never runs against an un-migrated schema.

```powershell
$env:DATABASE_URL="postgresql://<neon-direct-url>/neondb?sslmode=require"
$env:DIRECT_URL="postgresql://<neon-direct-url>/neondb?sslmode=require"
pnpm db:deploy
Remove-Item Env:DATABASE_URL, Env:DIRECT_URL
```

Notes:

- Set env vars override the local `.env` (dotenv never overwrites existing
  values), so your local config stays untouched.
- Use the Neon **direct** connection string (the same one as `DIRECT_URL`).
  If `DIRECT_URL` is unset, the Prisma CLI falls back to `DATABASE_URL`.
- `prisma migrate deploy` applies only unapplied migrations and is idempotent,
  so re-running it is safe.
- Do the same for the admin seed when needed: set `SEED_ADMIN_PASSWORD` +
  `DATABASE_URL`, run `pnpm seed:admin`.

## Environment

Copy `.env.example` to `.env` and fill in real values. Never commit `.env` or
any other `.env*` file.

| Variable              | Description                                                            |
| --------------------- | ---------------------------------------------------------------------- |
| `NODE_ENV`            | `development` \| `test` \| `production`                                |
| `PORT`                | HTTP listen port (default 4000)                                        |
| `API_URL`             | Base URL the API exposes itself at                                     |
| `WEB_URL`             | Base URL of the web frontend (used for invite links)                   |
| `LOG_LEVEL`           | pino log level (default `info`)                                        |
| `DATABASE_URL`        | Postgres connection string used at runtime (pooled in production)      |
| `DIRECT_URL`          | Optional — used by Prisma CLI/migrations; falls back to `DATABASE_URL` |
| `BETTER_AUTH_SECRET`  | better-auth secret (min 32 chars)                                      |
| `CORS_ORIGIN`         | Comma-separated allowed origins (also feeds trustedOrigins)            |
| `RESEND_API_KEY`      | Resend API key (required outside test)                                 |
| `EMAIL_FROM`          | Sender address (verified Resend domain `mail.blihops.com`)             |
| `EMAIL_LOGO_URL`      | Public URL of the logo shown in email templates                        |
| `SEED_ADMIN_PASSWORD` | Required only for `pnpm seed:admin` — never set in production          |
| `SEED_DEMO_PASSWORD`  | Required only for `pnpm seed:demo` — never set in production           |

The local Postgres from `docker compose` uses
`postgresql://blihops:blihops@localhost:5432/blihops`. The generated Prisma
client in `src/generated/` is git-ignored and recreated by `pnpm db:generate`.

## Repository structure

```
src/
  app.ts                       # Express app instance + route mounting
  server.ts                    # Entry point - env + listen + graceful shutdown
  features/
    auth/                      # Authentication, invitations, session token
    content/                   # Managed website content feature
      admin/                   # Auth-guarded admin surface (/api/v1/content/admin)
        <resource>/            # Per-resource admin module (schema, repository,
                               #   service, controller, router)
      common/                  # Shared helpers: sanitization, slug checks,
                               #   bilingual publish, tag validation, schemas
      <resource>/              # Per-resource public module + OpenAPI paths
      paths.ts                 # Aggregates OpenAPI path registrations
  generated/prisma/            # Generated Prisma client (git-ignored)
  shared/
    auth/                      # better-auth instance and config
    configs/                   # env validation, logger
    db/                        # Prisma client
    email/                     # Resend client and templates
    errors/                    # AppError hierarchy, error codes, envelopes
    middlewares/               # auth, validate, error handler, CORS, logging
    openapi/                   # OpenAPI registry, document generation, common helpers
    utils/                     # Response helpers
    scripts/                   # Seed scripts
tests/
  helpers/                     # Shared test helpers (auth sessions)
  setup/                       # Shared test bootstrap (env, testcontainers global setup, db reset)
  unit/                        # Fast unit tests (no Docker)
  integration/
    content/                   # Per-resource DB-backed tests via testcontainers (Docker)
.github/
  workflows/ci.yml
  CODEOWNERS
  PULL_REQUEST_TEMPLATE.md
.husky/                        # pre-commit, commit-msg, pre-push hooks
```

## Contributing

Read CONTRIBUTING.md.
