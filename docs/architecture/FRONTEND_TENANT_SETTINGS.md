> **Senkron kopya** — Kaynak: `../uniclub-backend/docs/integration/tenant-settings.md` · Backend commit: `4a79a0a`

# Tenant ayarlar? — Frontend entegrasyon

**Kapsam:** `GET/PATCH /api/universities/:universityId/settings` — tenant ba??na politika tu?lar? (sabitleme kotas?, okul geneli duyuru h?z?, özellik bayraklar?).

> Hata zarf?: [error-and-audit.md](../reference/error-and-audit.md). Auth: [auth-guards.md](auth-guards.md).

---

## Yetki

| ??lem | Permission | Tenant scope |
|---|---|---|
| GET / PATCH | `university.settings.manage` | Evet (`:universityId` = kendi tenant) |

`super_admin` tenant scope bypass eder. `university_admin` seed'de bu yetkiyi ta??r.

**Platform anahtarlar?:** `announcement.university.publish.per_hour`, `university.export.enabled`, `university.export.pdf.enabled` yaln?zca platform operatörü PATCH edebilir; tenant yönetici `403`.

---

## GET — çözümlenmi? ayarlar + metadata

```
GET /api/universities/:universityId/settings
Authorization: Bearer <token>
```

**200 `data`** — anahtar ? nesne:

```json
{
  "announcement.club.pinned.max": {
    "value": 3,
    "default": 3,
    "kind": "integer",
    "min": 0,
    "max": 10,
    "editor": "tenant",
    "labelTr": "Kulüp sabitleme kotas?",
    "labelEn": "Club pinned announcement limit"
  },
  "university.export.enabled": {
    "value": false,
    "default": false,
    "kind": "boolean",
    "editor": "platform",
    "labelTr": "Kurumsal rapor d??a aktarma",
    "labelEn": "Institutional report export"
  },
  "club.application.approval_chain": {
    "value": ["club_approver"],
    "default": ["club_approver"],
    "kind": "role_chain",
    "allowedRoles": ["club_approver", "advisor", "student_affairs", "university_admin"],
    "editor": "tenant",
    "labelTr": "Kulüp ba?vuru onay zinciri (kademe ? rol)",
    "labelEn": "Club application approval chain (step ? role)"
  }
}
```

- `value`: bugün geçerli çözümlenmi? de?er (DB sapmas? + varsay?lan).
- `kind`: `"integer"` | `"role_chain"` | `"boolean"` — boolean bayraklar için `flagType` (`entitlement` | `release`) ve `release` için `sunsetAfter` (`YYYY-MM-DD`) metadata'da gelir.
- `editor`: `"tenant"` | `"platform"` — UI'da düzenlenebilirlik.
- Ayar ekran?n? bu yan?ttan kurun; sabitleri frontend'e gömmeyin.

### Özellik bayraklar? (`kind: boolean`)

- `entitlement` — kal?c? yetkilendirme (ör. `university.export.enabled`)
- `release` — pilot sonras? kald?r?lacak geçici bayrak (ör. `university.export.pdf.enabled`)

Tenant panelinde **salt-okunur** gösterilir; kurum yöneticisi modülün aç?k/kapal? oldu?unu görebilmelidir.

---

## PATCH — k?smi güncelleme

```
PATCH /api/universities/:universityId/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "settings": {
    "announcement.club.pinned.max": 5,
    "announcement.university.pinned.max": null
  }
}
```

- Yaln?zca gönderilen anahtarlar güncellenir.
- `null` ? varsay?lana dönü? (DB sat?r? silinir).
- De?er = katalog `default` ile ayn?ysa sat?r silinir (seyrek model).
- S?n?r d??? ? `400`. Platform anahtar? + tenant yönetici ? `403`.

De?i?iklik an?nda etkilidir (cache SET); TTL beklenmez.

---

## Ayar anahtarlar? (v1)

| Anahtar | Varsay?lan | S?n?r | Düzenleyen |
|---|---|---|---|
| `announcement.club.pinned.max` | 3 | 0–10 | tenant |
| `announcement.university.pinned.max` | 3 | 0–10 | tenant |
| `announcement.university.publish.per_hour` | 5 | 1–100 | platform |
| `club.application.approval_chain` | `["club_approver"]` | 1–3 kademe, `allowedRoles` katalogda | tenant |
| `club.formation.support_threshold` | `0` | 0–500 (0 = destek toplama kapal?) | tenant |
| `club.formation.proposal_expiry_days` | `90` | 7–180 | tenant |
| `university.export.enabled` | `false` | boolean, `flagType: entitlement` | platform |
| `university.export.pdf.enabled` | `false` | boolean, `flagType: release`, `sunsetAfter: 2026-11-01` | platform |

---

## UI önerisi

1. GET ile formu doldur.
2. `editor === "platform"` sat?rlar?n? tenant panelinde salt-okunur göster (platform paneli ayr?).
3. `kind === "boolean"` için switch/checkbox; tenant için disabled.
4. PATCH ile yaln?zca de?i?en alanlar? gönder.
5. "S?f?rla" = ilgili anahtara `null` gönder.

Frontend rota: `/admin/settings` — menü: **Politikalar**.
