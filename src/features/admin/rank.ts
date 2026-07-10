// Rütbe (rank) hiyerarşisi — FRONTEND_RUTBE_VE_PLATFORM.md §3/§4.
//
// Backend kuralı: aktör yalnızca KENDİNDEN DÜŞÜK rütbeli rolü yönetebilir ve
// yalnızca KENDİNDEN DÜŞÜK rütbeli kullanıcıya dokunabilir. Eşitlik reddedilir,
// bu yüzden kimse kendine dokunamaz. `super_admin` rütbe kurallarından muaftır.
//
// Buradaki kontroller UI kolaylığıdır, güvenlik değildir — backend her koşulda
// kendi kontrolünü yapar ve ihlalde 400 + Türkçe mesaj döner (§5). Amaç,
// kullanıcının tıklayıp hataya çarpmasını önlemek.
import type { Role, RoleName } from "@/shared/types";

/** Bir kullanıcının etkin rütbesi = rollerindeki en yüksek rank. */
export const rankOf = (roles: Pick<Role, "rank">[]): number =>
  roles.reduce((max, r) => Math.max(max, r.rank), 0);

/** Yalnızca super_admin tarafından atanabilen platform rolleri (§5). */
const PLATFORM_ROLE_NAMES: RoleName[] = ["super_admin", "platform_support"];
export const isPlatformRoleName = (name: RoleName): boolean =>
  PLATFORM_ROLE_NAMES.includes(name);

/** Aksiyonları değerlendiren aktör — AuthContext'ten türetilir. */
export interface RankActor {
  userId: string;
  /** GET /users/me/permissions → maxRank */
  maxRank: number;
  isSuperAdmin: boolean;
}

/** Hedef rütbe aktörünkinden düşük mü? (super_admin muaf) */
export const outranks = (actor: RankActor, targetRank: number): boolean =>
  actor.isSuperAdmin || targetRank < actor.maxRank;

/** Bu kullanıcının rollerini/durumunu yönetebilir miyim? Kendime dokunamam. */
export const canManageUser = (
  actor: RankActor,
  target: { id: string; roles: Pick<Role, "rank">[] }
): boolean =>
  actor.isSuperAdmin || (target.id !== actor.userId && outranks(actor, rankOf(target.roles)));

/**
 * Bu rolü atayabilir/kaldırabilir miyim?
 * Platform rolleri (super_admin/platform_support) yalnızca super_admin'de.
 */
export const canAssignRole = (actor: RankActor, role: Pick<Role, "name" | "rank">): boolean => {
  if (actor.isSuperAdmin) return true;
  if (isPlatformRoleName(role.name)) return false;
  return role.rank < actor.maxRank;
};

/** Kendi rolünü SÖKME hiçbir koşulda mümkün değil (super_admin dahil). */
export const canRemoveRoleFrom = (
  actor: RankActor,
  target: { id: string; roles: Pick<Role, "rank">[] }
): boolean => target.id !== actor.userId && canManageUser(actor, target);

/** Bu rütbede yeni rol oluşturabilir/rolü bu rütbeye çekebilir miyim? */
export const canSetRoleRank = (actor: RankActor, rank: number): boolean =>
  actor.isSuperAdmin || rank < actor.maxRank;

// --- Disable sebeplerini kullanıcıya açıklayan başlıklar (title/tooltip) ---

export const selfActionReason = "Kendi hesabınız üzerinde bu işlemi yapamazsınız.";
export const outrankedReason =
  "Bu kullanıcı sizinle aynı ya da daha yüksek yetki seviyesinde.";
export const platformRoleReason = "Bu rol yalnızca sistem yöneticisi tarafından atanabilir.";
export const roleOutrankedReason =
  "Bu rol sizin yetki seviyenizle aynı ya da daha yüksek.";
