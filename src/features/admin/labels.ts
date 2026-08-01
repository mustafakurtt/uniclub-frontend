// Yönetim yüzeyinde ortak Türkçe etiketler — roller, yetkiler, hesap durumu.
// Tek nokta (Users/Roles/Permissions sayfaları). Roller/yetkiler runtime'da
// eklenebildiği için (kapalı liste değil) bu tablolar SADECE bilinen seed
// değerlerine "dostane ad" verir; bilinmeyen anahtar olduğu gibi gösterilir
// (bkz. roleLabel/permissionLabel). Kaynak: docs/FRONTEND_YONETIM.md §2/§3/§9.
import type { GlobalPermission, RoleName, UserStatus } from "@/shared/types";

/** Seed rollerinin Türkçe adları (rozet/başlık). */
export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Süper Yönetici",
  platform_support: "Platform Destek",
  university_admin: "Üniversite Yöneticisi",
  student_affairs: "Sağlık Kültür ve Spor (SKS)",
  academic_affairs: "Öğrenci İşleri / BİDB",
  content_moderator: "İçerik Moderatörü",
  auditor: "Denetçi",
  advisor: "Danışman",
  student: "Öğrenci",
};

export const roleLabel = (name: RoleName): string => ROLE_LABELS[name] ?? name;

/** Seed yetki anahtarlarının Türkçe açıklamaları (matris/liste başlığı). */
export const PERMISSION_LABELS: Record<string, string> = {
  "user.view": "Kullanıcıları görüntüle",
  "user.manage": "Kullanıcı durumu + bölüm",
  "club.view": "Kulüpleri görüntüle",
  "application.view": "Başvuruları görüntüle",
  "club.approve": "Başvuru onay/red",
  "club.update": "Kulüp durum + profil",
  "club.advisor.manage": "Danışman ata/kaldır",
  "club.member.manage": "Üye çıkar/rol düzelt",
  "club.delete": "Kulüp sil",
  "announcement.moderate": "Duyuru moderasyonu",
  "gallery.moderate": "Galeri moderasyonu",
  "university.update": "Üniversite profili",
  "university.domain.create": "Domain ekle",
  "university.domain.update": "Domain güncelle",
  "university.domain.delete": "Domain sil",
  "university.faculty.create": "Fakülte ekle",
  "university.faculty.update": "Fakülte güncelle",
  "university.faculty.delete": "Fakülte sil",
  "university.department.create": "Bölüm ekle",
  "university.department.update": "Bölüm güncelle",
  "university.department.delete": "Bölüm sil",
  "university.create": "Üniversite oluştur (platform)",
  "university.delete": "Üniversite sil (platform)",
  "role.manage": "Rol yönetimi + atama",
  "permission.manage": "Yetki kataloğu + kişisel claim",
  "audit.view": "Denetim izini görüntüle",
  "poster_qr.university.manage": "Okul geneli afiş QR yönetimi",
  "university.settings.manage": "Tenant politika ayarları",
};

/** Onay zincirindeki `approverRole` belirteçleri — ham token UI'da gösterilmez. */
export function approverRoleLabel(role: string): string {
  if (role === "club_approver") {
    return "Kulüp onay yetkilisi (club.approve yetkisi taşıyanlar)";
  }
  return roleLabel(role as RoleName);
}

export const permissionLabel = (key: GlobalPermission): string => PERMISSION_LABELS[key] ?? key;

/** Yetki kataloğunu gruplayan başlıklar (kaynak öneki → grup). */
export const PERMISSION_GROUPS: { title: string; match: (key: string) => boolean }[] = [
  { title: "Kullanıcılar", match: (k) => k.startsWith("user.") },
  {
    title: "Kulüpler & İçerik",
    match: (k) =>
      k.startsWith("club.") ||
      k.startsWith("application.") ||
      k.startsWith("announcement.") ||
      k.startsWith("gallery."),
  },
  { title: "Akademik Yapı", match: (k) => k.startsWith("university.") },
  { title: "RBAC / Platform", match: (k) => k === "role.manage" || k === "permission.manage" },
  { title: "Denetim", match: (k) => k.startsWith("audit.") },
];

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  pending: "Doğrulama Bekliyor",
  active: "Aktif",
  suspended: "Askıya Alındı",
};

export const USER_STATUS_CHIP_CLASSES: Record<UserStatus, string> = {
  active: "bg-green-50 text-green-700 border-green-100",
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  suspended: "bg-red-50 text-red-700 border-red-100",
};
