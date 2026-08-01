> **Senkron kopya** — Kaynak: `../uniclub-backend/docs/integration/clubs.md` §6/§6A + `admin-panel.md` · Backend commit: `2e3f9eb`

# Kuruluş önerisi ve dijital destek (T1.1)

Frontend entegrasyon özeti. Tam kaynak: backend `clubs.md` §6/§6A ve `admin-panel.md` kuruluş önerisi satırları.

> Tenant ayarları: `club.formation.support_threshold` (0 = kapalı), `club.formation.proposal_expiry_days` — bkz. [FRONTEND_TENANT_SETTINGS.md](FRONTEND_TENANT_SETTINGS.md).

---

## Öğrenci yüzeyi

Tenant `club.formation.support_threshold > 0` ise `POST /api/clubs/applications` **kuruluş önerisi** oluşturur; eşik aşıldığında otomatik `clubApplications` kaydı açılır.

| Method | Path | Açıklama |
|---|---|---|
| GET | `/api/clubs/formation-proposals` | Destek toplanan açık öneriler (`hasSupported` gömülü) |
| GET | `/api/clubs/formation-proposals/:id` | Detay (`isProposer`, `applicationId`, `submittedAt`) |
| POST | `/api/clubs/formation-proposals/:id/support` | Destek ver |
| DELETE | `/api/clubs/formation-proposals/:id/support` | Desteği geri çek |
| DELETE | `/api/clubs/formation-proposals/:id` | Öneriyi geri çek (sahip, `collecting_support`) |

**KVKK:** Öğrenci yalnızca `supportCount` görür; destekçi kimlik listesi **yalnızca SKS admin detayında**.

`POST /api/clubs/applications` → `201`:
- `kind: "application"` — doğrudan onay zinciri (`status: "pending"`)
- `kind: "formation_proposal"` — destek toplama (`status: "collecting_support"`, `supportThreshold`)

Yanıt alanları: `id`, `proposedName`, `description`, `status`, `supportCount`, `supportThreshold`, `expiresAt`, `createdAt`, `proposer`, `hasSupported` (liste), `isProposer` (detay), `submittedAt`, `applicationId`.

**Bildirim:** Eşik aşıldığında `club.formation.threshold_reached` (`data.proposalId`, `data.applicationId`).

### Hata kodları (400)

| `code` | Anlam |
|---|---|
| `club.cannotSupportOwnProposal` | Kendi önerine destek |
| `club.formationAlreadySupported` | Zaten destekledin |
| `club.formationSupportNotFound` | Geri çekilecek destek yok |
| `club.formationProposalNotWithdrawable` | `collecting_support` dışı geri çekme |
| `club.formationSupportDisabled` | Eşik 0 — özellik kapalı |
| `club.pendingApplicationExists` | Aktif başvuru veya açık öneri var |

---

## Admin — SKS

| Method | Path | Yetki | Açıklama |
|---|---|---|---|
| GET | `/api/admin/universities/:uid/formation-proposals?status=` | `application.view` | Liste (`collecting_support` / `submitted` / `expired` / `withdrawn`) |
| GET | `/api/admin/universities/:uid/formation-proposals/:id` | `application.view` | Detay + **destekçi listesi** (`supporters[].user`, `supportedAt`) |

Eşik aşıldığında öneri `submitted` olur ve `applicationId` dolar; onay zinciri `club-applications` akışıyla devam eder.
