// Denetim izi (audit log) — docs/DENETIM_VE_HATA.md §1. Okuma yetkisi `audit.view`
// (auditor, university_admin, platform_support, super_admin). Tablo append-only:
// güncelleme/silme ucu yoktur.
import type { SafeUser } from "./user";

/** `metadata.body`'deki hassas alanlar (password, token...) backend'de zaten maskelenir. */
export interface AuditLogMetadata {
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
}

export interface AuditLog {
  id: string;
  actorId: string;
  /** Ad/soyad/e-posta join'lenir; aktör silinmişse embed gelmeyebilir. */
  actor?: Pick<SafeUser, "id" | "firstName" | "lastName" | "email">;
  /** Rotanın yetki anahtarı: `user.manage`, `club.approve`, `university.faculty.update`... */
  action: string;
  method: string;
  path: string;
  /** Yanıt kodu — 403 de kaydedilir (reddedilen yetkili-işlem denemesi). */
  status: number;
  /** Path parametrelerinden türetilen hedef kaynak türü (`user`, `club`, `club_application`...) */
  targetType: string | null;
  targetId: string | null;
  metadata: AuditLogMetadata | null;
  ip: string | null;
  /** Kapsam: path'teki tenant → yoksa aktörün tenant'ı → yoksa null (platform işlemi). */
  universityId: string | null;
  createdAt: string;
}

/** Keyset (cursor) sayfalama — bildirimlerle aynı desen (§1). */
export interface AuditLogPage {
  items: AuditLog[];
  nextCursor: string | null;
}
