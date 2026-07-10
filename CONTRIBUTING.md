# Contributing

Thanks for working on UniClub. This guide covers the day-to-day development workflow.

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.1
- [VS Code](https://code.visualstudio.com/) (recommended — the repo ships shared settings)
- A running instance of the backend API
- Docker (optional — only needed to test the production image)

## Local setup

```bash
git clone https://github.com/mustafakurtt/uniclub-frontend.git
cd uniclub-frontend

bun install
cp .env.example .env     # then point VITE_API_BASE_URL at your backend

bun run dev              # http://localhost:5173
```

On first open, VS Code will offer to install the recommended extensions — accept them.

> **Day-to-day development uses `bun run dev`, not Docker.** Docker exists to build the
> production artifact and to verify prod parity; it has no hot-reload and will slow you
> down. Only run `docker compose up --build` when you want to check the real nginx build.

## Branching model

| Branch | Purpose | Protected |
| --- | --- | --- |
| `main` | Production-ready code. Every commit is deployable. | Yes |
| `dev` | Integration branch. Day-to-day work merges here. | Yes |
| `feature/*`, `fix/*`, `chore/*` | Short-lived, one unit of work. | No |

**Never commit directly to `main` or `dev`.** Both require a pull request.

Branch names mirror the commit type:

```
feature/club-gallery-upload
fix/notification-badge-drift
chore/bump-tanstack-query
```

## Workflow

```bash
# 1. Start from an up-to-date dev
git checkout dev
git pull origin dev

# 2. Branch off
git checkout -b feature/club-gallery-upload

# 3. Work, committing in logical chunks
git add -p
git commit -m "feat(clubs): allow officers to upload gallery images"

# 4. Push and open a PR into dev
git push -u origin feature/club-gallery-upload
gh pr create --base dev --fill
```

CI (lint → typecheck → build → Docker build) must pass, and one review is required,
before the PR can merge. Use **Squash and merge** so `dev` keeps one commit per unit of
work.

**Releasing:** when `dev` is stable, open a PR from `dev` into `main`. Use a **merge
commit** (not squash) so `main` and `dev` do not diverge.

> `dev` and `main` always contain the *same files*. Branches are not environments —
> environment differences belong in env vars, `.dockerignore` and build config, never in
> branch contents.

## Commit convention

We use [Conventional Commits](https://www.conventionalcommits.org/). The subject is
imperative and lowercase.

```
<type>(<optional scope>): <subject>
```

| Type | Use for |
| --- | --- |
| `feat` | A new user-facing capability |
| `fix` | A bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `docs` | Documentation only |
| `style` | Formatting, no code-behaviour change |
| `build` | Build system, Docker, dependencies |
| `ci` | CI configuration |
| `chore` | Anything else (tooling, housekeeping) |

Scopes follow the feature folders: `auth`, `clubs`, `admin`, `universities`,
`notifications`, `shared`.

## Code conventions

Full architectural detail lives in [`CLAUDE.md`](CLAUDE.md) and [`docs/`](docs/). The
short version:

- **Feature-first layout.** Everything a feature owns (API calls, pages, components,
  hooks, labels) lives under `src/features/<feature>/`. Cross-feature building blocks go
  in `src/shared/`.
- **Always import via the `@/` alias** (→ `src/`). No `../../` relative imports.
- **Split files over ~250 lines** into a thin shell composing self-contained sections.
- **Auth data comes from `useAuth()`**, never from page-local queries or `localStorage`.
- **Decide UI visibility by permission key** (`can("club.approve")`), not by role name.
- **Reuse the design system** — the component classes in `src/index.css` and the
  components in `src/shared/ui/`, rather than re-rolling raw utility strings.
- **UI copy is Turkish.** Backend `message` strings are Turkish and safe to render
  verbatim.
- **Never redeclare domain types** — import them from `@/shared/types`.

## Before opening a pull request

```bash
bun run lint
bun run typecheck
bun run build
```

All three must pass — CI runs exactly these. Then verify the change in the running app;
a green build is not proof the feature works.

## Secrets & configuration

- **Never commit a `.env` file.** It is git-ignored; `.env.example` is the template.
- Only `VITE_`-prefixed variables reach the client bundle — and anything in that bundle
  is **public**. Never put a secret in a `VITE_` variable.
- The API base URL is baked in at build time. For containers, pass it as a build arg:
  `docker build --build-arg VITE_API_BASE_URL=... .`

## Questions

Open an issue using one of the templates, or start a discussion in the PR.
