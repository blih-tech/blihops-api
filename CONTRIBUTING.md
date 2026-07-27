# Contributing

## Setup

```bash
corepack enable pnpm
pnpm install
cp .env.example .env.local
pnpm dev
```

## Branches

Create branches from an updated `main`:

```bash
git switch main
git pull --ff-only origin main
git switch -c feature/short-description
```

Allowed prefixes:

- `feature/`
- `fix/`
- `chore/`
- `docs/`
- `ci/`
- `hotfix/`

Use lowercase kebab-case after the prefix. The `pre-push` hook rejects other
patterns.

## Commits

Use Conventional Commits:

```
type(optional-scope): description
```

Examples:

```
feat: add auth middleware
fix(logging): prevent pino crash on null body
docs: update env table
chore: update dependencies
ci: add dependency audit
test: add /health endpoint tests
refactor: split app and server
```

The `commit-msg` hook validates every commit message.

## Before opening a pull request

```bash
pnpm check
pnpm test
```

## Before staging files

Check for accidental files:

```bash
git status --short
git status --ignored --short
```

Never commit:

- `.env*` (except `.env.example`)
- `dist/`
- `coverage/`
- `node_modules/`
- Any lockfile other than `pnpm-lock.yaml`

## Pull requests

1. Push your branch.
2. Open a pull request into `main`.
3. Complete the pull request template.
4. Wait for CI.
5. Request review from the code owner.
6. Resolve all review conversations.
7. Squash merge after approval.

## After merge

```bash
git switch main
git pull --ff-only origin main
git branch -d feature/short-description
```
