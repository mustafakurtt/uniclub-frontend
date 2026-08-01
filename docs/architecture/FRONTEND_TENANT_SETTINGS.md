> **Senkron kopya** ? Kaynak: `../uniclub-backend/docs/integration/tenant-settings.md` ? Backend commit: `e666b44`

# Tenant ayarlar? ? Frontend entegrasyon

**Kapsam:** `GET/PATCH /api/universities/:universityId/settings` ? tenant baº?na politika tuºlar? (sabitleme kotas?, okul geneli duyuru h?z?).

> Hata zarf?: [error-and-audit.md](../reference/error-and-audit.md). Auth: [auth-guards.md](auth-guards.md).

---

## Yetki

| ?ºlem | Permission | Tenant scope |
|---|---|---|
| GET / PATCH | `university.settings.manage` | Evet (`:universityId` = kendi tenant) |

`super_admin` tenant scope bypass eder. `university_admin` seed'de bu yetkiyi taº?r.

**Platform anahtar?:** `announcement.university.publish.per_hour` yaln?zca platform operatörü (`super_admin` bypass veya `platform.tenant.manage`) PATCH edebilir; tenant yönetici `403`.

---

## GET ? çözümlenmiº ayarlar + metadata

```
GET /api/universities/:universityId/settings
Authorization: Bearer <token>
```

**200 `data`** ? anahtar ? nesne:

```json
{
  "announcement.club.pinned.max": {
    "value": 3,
    "default": 3,
    "min": 0,
    "max": 10,
    "editor": "tenant",
    "labelTr": "Kulüp sabitleme kotas?",
    "labelEn": "Club pinned announcement limit"
  },
  "announcement.university.pinned.max": { ... },
  "announcement.university.publish.per_hour": {
    "value": 5,
    "default": 5,
    "min": 1,
    "max": 100,
    "editor": "platform",
    ...
  },
  "club.application.approval_chain": {
    "value": ["club_approver"],
    "default": ["club_approver"],
    "kind": "role_chain",
    "allowedRoles": ["club_approver", "advisor", "student_affairs", "university_admin", ...],
    "editor": "tenant",
    "labelTr": "Kulüp baºvuru onay zinciri (kademe ? rol)",
    "labelEn": "Club application approval chain (step ? role)"
  }
}
```

- `value`: bugün geçerli çözümlenmiº de?er (DB sapmas? + varsay?lan).
- `editor`: `"tenant"` | `"platform"` ? UI'da düzenlenebilirlik.
- Ayar ekran?n? bu yan?ttan kurun; sabitleri frontend'e gömmeyin.

---

## PATCH ? k?smi güncelleme

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
- `null` ? varsay?lana dönüº (DB sat?r? silinir).
- De?er = katalog `default` ile ayn?ysa sat?r silinir (seyrek model).
- S?n?r d?º? ? `400`. Platform anahtar? + tenant yönetici ? `403`.

De?iºiklik an?nda etkilidir (cache SET); TTL beklenmez.

---

## Ayar anahtarlar? (v1)

| Anahtar | Varsay?lan | S?n?r | Düzenleyen |
|---|---|---|---|
| `announcement.club.pinned.max` | 3 | 0?10 | tenant |
| `announcement.university.pinned.max` | 3 | 0?10 | tenant |
| `announcement.university.publish.per_hour` | 5 | 1?100 | platform |
| `club.application.approval_chain` | `["club_approver"]` | 1?3 kademe, `allowedRoles` katalogda | tenant |

`club.application.approval_chain` ? JSON dizi: her eleman bir kademenin karar verici rolü.
`club_approver` özel token: `club.approve` yetkisini taº?yanlar. Örnek iki kademe:
`["advisor", "student_affairs"]` (seed'de Ege Bilim). Varsay?lan tek kademe mevcut
tenant'larda davran?º? de?iºtirmez.

---

## UI önerisi

1. GET ile formu doldur.
2. `editor === "platform"` sat?rlar?n? tenant panelinde salt-okunur göster (platform paneli ayr?).
3. PATCH ile yaln?zca de?iºen alanlar? gönder.
4. "S?f?rla" = ilgili anahtara `null` gönder.
