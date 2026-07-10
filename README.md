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
│   ├── clubs/           # club listing/detail, membership roles
│   ├── admin/           # tenant management panel (users, clubs, roles, permissions)
│   ├── universities/    # university management
│   └── notifications/   # realtime WebSocket + notification bell
├── shared/              # api client, shared hooks, UI kit, domain types
├── layouts/             # MainLayout, AdminLayout
├── pages/               # Landing, Dashboard
└── App.tsx              # routing
```

The backend contract is documented in [`docs/architecture/`](docs/architecture/).

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

## Branching & CI

- **`main`** — production-ready, protected. Merges via reviewed PRs only.
- **`dev`** — integration branch for day-to-day work.

Every push and pull request to `main`/`dev` runs the [CI workflow](.github/workflows/ci.yml):
lint → typecheck → build, plus a Docker build check.

## Roadmap

- [ ] Automated tests (component + e2e)
- [ ] Continuous deployment (static host / container registry)
- [ ] Web Push (VAPID) for notifications while the app is closed

## License

[MIT](LICENSE) © Mustafa Kurt
