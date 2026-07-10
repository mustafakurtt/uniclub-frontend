# Documentation

Reference material for the UniClub frontend. The backend is a separate service; these
documents describe the contract the frontend is built against.

## `architecture/` — backend contract & feature specs

| Document | Scope |
| --- | --- |
| [FRONTEND_AUTH_RBAC.md](architecture/FRONTEND_AUTH_RBAC.md) | Auth foundation + self-service (register, login, verify, profile) |
| [FRONTEND_YONETIM.md](architecture/FRONTEND_YONETIM.md) | Management / RBAC surface — 9-role model, granular permissions, admin endpoints |
| [FRONTEND_RUTBE_VE_PLATFORM.md](architecture/FRONTEND_RUTBE_VE_PLATFORM.md) | Role rank hierarchy + tenantless platform accounts |
| [FRONTEND_BILDIRIM_VE_LIMITLER.md](architecture/FRONTEND_BILDIRIM_VE_LIMITLER.md) | Realtime notifications, rate limiting, pending-account write lock |
| [FRONTEND_CLUBS.md](architecture/FRONTEND_CLUBS.md) | Clubs & memberships |
| [FRONTEND_UNIVERSITY.md](architecture/FRONTEND_UNIVERSITY.md) | University management |
| [FRONTEND_AUTH_GUARD_GUIDE.md](architecture/FRONTEND_AUTH_GUARD_GUIDE.md) | Route/UI guard patterns |
| [MAIL_DOGRULAMA.md](architecture/MAIL_DOGRULAMA.md) | E-mail verification flow |
| [API.md](architecture/API.md) | Consolidated API reference |

## `design-notes/` — internal design & planning

Early design explorations for the management/RBAC subsystem (role model redesign,
scenarios, endpoint proposals). Kept for context; not a source of truth for the current
implementation — defer to the `architecture/` documents above.

> All backend `message` strings are Turkish and rendered verbatim in the UI.
