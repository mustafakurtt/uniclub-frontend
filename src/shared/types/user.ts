// Kullanıcı ve global rol (doküman §4.1, §5.1) — "safe user": passwordHash asla gelmez.
// Rolün TAŞIDIĞI yetkiler (permission) ./rbac.ts'tedir.
import type { Department, University } from "./university";

export type UserStatus = "pending" | "active" | "suspended";

// Katman A — global roller (kurumsal 9-rollük v2 model — docs/FRONTEND_YONETIM.md §2).
// Seed değerleri bilinir ama liste kapalı değildir (runtime'da yeni rol tanımlanabilir);
// `string & {}` bilinen değerlerde autocomplete verip serbest değere izin verir.
//
// DİKKAT: eski `admin` rolü artık `university_admin`'dir (promote-admin URL'i
// geriye dönük uyumluluk için aynı kaldı ama role adı değişti).
export type RoleName =
  | "super_admin"
  | "platform_support"
  | "university_admin"
  | "student_affairs"
  | "academic_affairs"
  | "content_moderator"
  | "auditor"
  | "advisor"
  | "student"
  | (string & {});

export interface SafeUser {
  id: string;
  /**
   * null = platform çalışanı (super_admin, platform_support …) — hiçbir
   * üniversiteye bağlı değildir (FRONTEND_RUTBE_VE_PLATFORM.md §1).
   * Bu hesaplar öğrenci self-service akışlarına giremez (backend 400 döner) ve
   * yönetim hedefi kullanıcıdan DEĞİL, seçilen üniversiteden gelir.
   */
  universityId: string | null;
  departmentId: string | null;
  studentNumber: string | null;
  email: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  preferredLanguage: string;
  status: UserStatus;
  /** KVKK anonimleştirme sonrası dolu — kimlik alanları maskelenir. */
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  universityId: string | null; // null = sistem geneli rol
  name: RoleName;
  description: string | null;
  /**
   * Yetki derecesi, 0–100 (yüksek = daha yetkili). Seed: super_admin 100,
   * platform_support 90, university_admin 60, *_affairs 45, moderator/auditor 30,
   * advisor 20, student 10. Aktör yalnızca KENDİNDEN DÜŞÜK rütbeli rolü/kullanıcıyı
   * yönetebilir — eşitlik de reddedilir (FRONTEND_RUTBE_VE_PLATFORM.md §3/§4).
   */
  rank: number;
}

/** GET /users/me — oturumun ana veri kaynağı: profil + ilişkiler + roller */
export interface MeProfile extends SafeUser {
  /** Platform hesabında null (tenant'sız). */
  university: University | null;
  department: Department | null;
  roles: Role[];
}
