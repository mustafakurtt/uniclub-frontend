// Katman A (global RBAC) yardımcıları — TEK geçiş noktası.
//
// v2 (Temmuz 2026, docs/FRONTEND_YONETIM.md §4): Backend artık etkin (effective)
// yetki listesini `GET /api/users/me/permissions` ile dışarı veriyor. Bu yüzden
// eski "rol adından permission türet" çözümü (SEED_ROLE_PERMISSIONS /
// resolvePermissionsFromRoles) KALDIRILDI — AuthContext permissions'ı doğrudan
// response'tan okur. Bu dosyada yalnızca:
//   • UI gruplaması için permission demetleri (nav görünürlüğü),
//   • birkaç rol-adı bazlı karar (çapraz-tenant seçici, süper yönetici rozeti)
// kalır. Yetki KARARI her zaman `hasPermission(key)` iledir, rol adıyla değil.

import type { GlobalPermission, RoleName } from "@/shared/types";

// University/akademik yapı yazma yetkileri (granüler). Nav'da "Akademik yapı"
// bölümünün görünürlüğü bu demetten herhangi birine bakar.
export const UNIVERSITY_PERMISSIONS: GlobalPermission[] = [
  "university.update",
  "university.domain.create",
  "university.domain.update",
  "university.domain.delete",
  "university.faculty.create",
  "university.faculty.update",
  "university.faculty.delete",
  "university.department.create",
  "university.department.update",
  "university.department.delete",
];

// Platform-seviyesi üniversite işleri (yalnızca super_admin) — tenant değil.
export const UNIVERSITY_PLATFORM_PERMISSIONS: GlobalPermission[] = [
  "university.create",
  "university.delete",
];

// Kulüp gözetimi yetkileri (tenant). Nav'da "Kulüpler" bölümünün görünürlüğü.
// `club.member.manage` BİLİNÇLİ olarak burada YOK: AdminClubs sayfasında hiçbir
// buton bu yetkiye bakmaz, gerçek karşılığı "Moderasyon" bölümüdür (aşağıda) —
// yoksa yalnızca bu yetkisi olan bir rol boş bir "Kulüpler" sekmesine düşerdi.
export const CLUB_PERMISSIONS: GlobalPermission[] = [
  "club.view",
  "club.approve",
  "club.update",
  "club.advisor.manage",
  "club.delete",
];

// Üye & içerik moderasyonu (tenant üstten müdahale) — kulübün KENDİ officer/
// başkan katmanından ayrı, granüler yetkilerle çalışır. Nav'da "Moderasyon"
// bölümünün görünürlüğü bu demetten herhangi birine bakar. `club.view` bilinçli
// olarak burada YOK: yalnızca görüntüleme yetkisi olan biri (ör. auditor) bu
// sayfada hiçbir aksiyon alamaz, "Kulüpler" bölümü zaten onu karşılar.
export const MODERATION_PERMISSIONS: GlobalPermission[] = [
  "club.member.manage",
  "announcement.moderate",
  "gallery.moderate",
];

// Çekirdek (sistem) rol adları — UI'da adları değiştirilemez/silinemez olarak
// işaretlemek için (backend de korur, §6.2). Runtime'da eklenen tenant rolleri
// bu listede yer almaz.
export const CORE_ROLE_NAMES: RoleName[] = [
  "student",
  "advisor",
  "university_admin",
  "super_admin",
  "platform_support",
];

/** Yönetim panelini görebilen (tenant scope bypass eden) platform rolleri. */
export function isPlatformRole(roleNames: RoleName[]): boolean {
  return roleNames.includes("super_admin") || roleNames.includes("platform_support");
}

/** Süper yönetici rozeti + super_admin'e özel aksiyonlar (ör. promote-super-admin). */
export function isSuperAdminRole(roleNames: RoleName[]): boolean {
  return roleNames.includes("super_admin");
}
