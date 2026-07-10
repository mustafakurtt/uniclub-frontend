// Admin feature'ının ortak URL kökü — /api/admin (docs/FRONTEND_YONETIM.md §5).
//
// Tenant çapındaki yönetim yüzeyi: her uç `guard(<permission>, { tenantScoped: true })`
// arkasındadır — path'teki universityId çağıranın kendi üniversitesiyle eşleşmeli
// (super_admin/platform_support herhangi bir üniversiteyi hedefleyebilir). Okuma
// ve yazma yetkileri ayrıdır (`*.view` / mutasyon) → salt-okunur roller mümkün.
//
// Kulüp-İÇİ yönetim (officer/başkan) features/clubs/api/clubs.ts'tedir — iki katman
// karıştırılmamalı (FRONTEND_CLUBS.md §1). RBAC/rol/yetki uçları ise ./rbac.ts'te.
export const adminBase = (universityId: string) => `/admin/universities/${universityId}`;
