<div align="center">

# UniClub — Frontend

**A multi-tenant university club & community management platform.**

Discover clubs, join events, and manage your campus community — with a full
role-based access control (RBAC) admin panel and realtime notifications.

[![CI](https://github.com/mustafakurtt/uniclub-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/mustafakurtt/uniclub-frontend/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss&logoColor=white)

</div>

> **Note** — This repository contains the **frontend only**. It talks to a separate
> backend service over REST + WebSocket (see [`docs/`](docs/) for the API contract).

---

## Screenshots

<!-- Add screenshots / a short GIF here (landing page, dashboard, admin panel). -->
_Coming soon._

## Features

- **Authentication & self-service** — registration (university inferred from e-mail
  domain), login, e-mail verification, profile & password management.
- **Two-layer RBAC**
  - **Global roles** — a runtime-editable 9-role model (`super_admin` → `student`)
    with granular `resource.action` permissions and a **rank hierarchy** (an actor
    may only act on roles/users strictly below their own rank).
  - **Per-club roles** — `member` / `officer` / `president`.
- **Multi-tenant** — university-scoped admins plus tenantless **platform accounts**
  with a cross-tenant selector.
- **Events** — discovery (upcoming/past, search, per-club), detail with capacity and
  co-hosting clubs, RSVP; club staff can create, publish, cancel, manage attendees and
  invite co-hosts (including clubs from other universities).
- **Publishing** — announcements and events carry a draft → published lifecycle with
  visibility scoping, pinning, and **scheduled publishing**. Scheduled times are sent as
  the tenant's wall clock with no offset — the backend interprets them in the university's
  own timezone, so "tomorrow 09:00" means campus time.
- **Public surface** — club and event pages that need **no account**, for prospective
  students and open-day visitors. Rendered outside the authenticated shell.
- **QR** — poster QR codes with source labels ("cafeteria", "block A") so you can see
  which printed poster actually worked, a retargetable destination so a reprint isn't
  needed when an event changes, printable A4/A5 output, plus rotating check-in QR for
  attendance.
- **Admin panel** — users, clubs, universities, roles and permissions management, each
  section gated by a specific permission.
- **Realtime notifications** — one WebSocket per session (single-use ticket auth,
  ping/pong keep-alive, exponential backoff + jitter reconnect) driving TanStack Query
  cache invalidations so the UI never drifts from the server.
- **Resilience by design** — rate-limit aware buttons with cooldowns, a
  pending-account write lock, and centralized error semantics.

## Tech Stack

| Area | Choice |
| --- | --- |
| Framework | React 19 + TypeScript |
| Build tool | Vite 8 |
| Routing | React Router v7 |
| Server state | TanStack Query v5 |
| Forms & validation | react-hook-form + zod |
| HTTP | axios |
| Styling | Tailwind CSS 3 |
| Linting | oxlint |
| Package manager | Bun |

## Architecture

The codebase is **feature-first**: everything a feature owns (API calls, pages,
components, hooks, labels) lives under `src/features/<feature>/`, and cross-feature
building blocks live under `src/shared/`. Imports always use the `@/` alias (→ `src/`) —
no `../../` relative paths.

```
src/
├── features/
│   ├── auth/            # identity, RBAC guards, role-rank rules, self-service pages
│   ├── clubs/           # club listing/detail, membership roles, announcements
│   ├── activities/      # event discovery, RSVP, club-side management, check-in
│   ├── poster-qr/       # poster QR management, analytics, printable output
│   ├── public/          # unauthenticated club/event pages + QR resolution
│   ├── admin/           # tenant management panel (users, clubs, roles, permissions)
│   ├── universities/    # university management
│   └── notifications/   # realtime WebSocket + notification bell
├── shared/              # api client, shared hooks, UI kit, domain types
├── layouts/             # MainLayout, AdminLayout, PublicLayout
├── pages/               # Landing, Dashboard
└── App.tsx              # routing
```

The backend contract lives in [`docs/architecture/`](docs/architecture/) as **synced
copies** — the source of truth is the backend repo's `docs/integration/`. Each file
carries the source path and the backend commit it was synced from, so drift is visible.
Re-sync before building against an endpoint you haven't touched in a while.

## Getting Started

**Prerequisites:** [Bun](https://bun.sh) ≥ 1.1 and a running instance of the backend API.

```bash
# 1. Install dependencies
bun install

# 2. Configure the environment
cp .env.example .env
# edit .env → point VITE_API_BASE_URL at your backend (default: http://localhost:3000/api)

# 3. Start the dev server
bun run dev
```

The app runs at `http://localhost:5173`.

## Configuration

All configuration is via environment variables (only `VITE_`-prefixed variables are
exposed to the client). See [`.env.example`](.env.example).

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | REST + WebSocket base URL (must end in `/api`) | `http://localhost:3000/api` |

## Available Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start the Vite dev server with HMR |
| `bun run build` | Typecheck (`tsc -b`) and build for production |
| `bun run typecheck` | Type-check only |
| `bun run lint` | Run oxlint |
| `bun run preview` | Preview the production build locally |

## Docker

The app builds into a static bundle served by nginx (with SPA fallback so client-side
routes survive a refresh).

```bash
# Build the image (bakes VITE_API_BASE_URL at build time)
docker build -t uniclub-frontend \
  --build-arg VITE_API_BASE_URL=https://api.example.com/api .

# Run it
docker run --rm -p 8080:80 uniclub-frontend
# → http://localhost:8080
```

Or with Docker Compose:

```bash
VITE_API_BASE_URL=https://api.example.com/api docker compose up --build
```

## Branching, CI & releases

- **`main`** — production-ready. Protected: no direct pushes, PR + green CI required.
- **`dev`** — integration branch for day-to-day work.

Every push and pull request to `main`/`dev` runs [CI](.github/workflows/ci.yml):
lint → typecheck → build, plus a Docker build check. In parallel,
[Release check](.github/workflows/release-check.yml) builds the production image and
proves nginx actually serves the SPA (HTTP 200 + SPA fallback on deep routes).

**Deployment is pull-based** — the production machine (a laptop) reads GitHub, sees the
latest release, verifies its CI is green, then **builds the image itself** and deploys it.
Nothing is pushed to a registry and GitHub never connects to the production box. Cutting a
release is the only trigger. See [CONTRIBUTING.md](CONTRIBUTING.md) and
[docs/architecture/MAKINE_KURULUMU.md](docs/architecture/MAKINE_KURULUMU.md) for the full
pipeline.

## Contributing

Branch off `dev`, follow [Conventional Commits](https://www.conventionalcommits.org/),
and open a PR. Setup instructions, the branching model and code conventions are in
[CONTRIBUTING.md](CONTRIBUTING.md).

## Roadmap

- [ ] **Automated tests (component + e2e)** — this repo has no test runner today;
      quality gates are `typecheck`, `lint` and `build`. The backend carries the
      integration suite.
- [ ] **Server-side rendering / prerender for public routes** — link preview bots
      (WhatsApp, Instagram, Telegram) don't execute JavaScript, so the per-page
      `og:*` tags set at runtime never reach them. Public pages currently share one
      generic preview card.
- [ ] Web Push (VAPID) for notifications while the app is closed — the backend
      already supports it.
- [x] Pull-based deployment (release-triggered, self-building agent — see [MAKINE_KURULUMU.md](docs/architecture/MAKINE_KURULUMU.md))

## License

[MIT](LICENSE) © Mustafa Kurt
