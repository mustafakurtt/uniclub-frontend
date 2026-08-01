> **Senkron kopya** — Kaynak: `../uniclub-backend/docs/integration/exports.md` · Backend commit: `cbbc877`

# Kurumsal rapor dışa aktarma (T4.5 v1)

SKS ve okul yöneticisinin kulüp/üye/etkinlik verisini Excel tabloları ve resmî PDF belgeler olarak indirmesi.

**Yetki:** `university.export.generate` (`university_admin`, `student_affairs` demetlerinde). Rotalar `guard(..., { tenantScoped: true })` ile korunur; POST üretimleri `audit_logs`'a düşer.

**Özellik bayrağı:** `university.export.enabled` (`flagType: entitlement`, varsayılan `false`). Bayrak kapalı tenant'ta export uçları **404** döner. PDF raporları da katalogda **dönmez** — frontend ek kontrol yazmaz.

## Uçlar

| Method | Path | Açıklama |
|---|---|---|
| GET | `/api/universities/:universityId/exports` | Rapor kataloğu |
| POST | `/api/universities/:universityId/exports/:reportId` | Rapor/belge üret → dosya gövdesi |

Katalog satırı: `id`, `labelTr`, `labelEn`, **`format`** (`"xlsx"` \| `"pdf"`), `parameters[]`.

POST yanıtı dosya akışıdır; `Content-Disposition: attachment; filename="..."`. Dosya adı sunucudan alınır.

Excel üretimi başarısızsa UTF-8 BOM + `;` ayırıcılı CSV döner; `X-Export-Fallback: csv` başlığı eklenir.

## Veri tabloları (`format: "xlsx"`)

### `clubs` — kulüp listesi

```jsonc
{ "status": "approved|pending|rejected|archived", "createdFrom": "ISO-8601", "createdTo": "ISO-8601" }
```

### `club-members` — üye listesi

`clubId` **zorunlu**. Tenant dışı kulüp → `404`.

```jsonc
{ "clubId": "uuid", "role": "member|officer|president", "status": "pending|approved|rejected" }
```

### `activities` — etkinlik takvimi

```jsonc
{ "from": "ISO-8601", "to": "ISO-8601", "clubId": "uuid", "status": "draft|published|cancelled" }
```

## Resmî belgeler (`format: "pdf"`)

### `annual-activity-report` — yıllık faaliyet raporu

```jsonc
{ "year": 2025 }
```

Parametre: `year` (`integer`, zorunlu).

### `application-decision-minutes` — kulüp başvuru karar tutanağı

```jsonc
{ "applicationId": "uuid" }
```

Parametre: `applicationId` (`string`/UUID, zorunlu).

## Parametre şeması

| `type` / `name` | UI |
|---|---|
| `date` | Tarih seçici |
| `enum` | Select |
| `integer` / `year` | Yıl sayısı |
| `name: "clubId"` | Kulüp seçici |
| `name: "applicationId"` | Başvuru seçici |

## Sınırlar ve hata kodları

- Üst satır sınırı (xlsx): **50.000** — `400` + `exports.rowLimitExceeded`.
- Cache yok; her istek canlı üretim.

| `code` | HTTP | Anlam |
|---|---|---|
| `exports.rowLimitExceeded` | 400 | Filtreleri daralt |
| `exports.reportNotFound` | 404 | Geçersiz rapor |
| `exports.clubNotFound` | 404 | Kulüp yok / tenant dışı |

## Deterministik çıktı (xlsx)

Aynı parametrelerle üretilen dosyalar bayt bayt aynı olmalı. Başlık bloğu: üniversite adı, rapor başlığı, parametre özeti. Tenant `primaryColor` (varsa) başlık vurgusu; logo gömülmez (v1).
