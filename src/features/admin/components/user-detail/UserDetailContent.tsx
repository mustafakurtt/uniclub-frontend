import { useAuth } from "@/features/auth/hooks/useAuth";
import AccountStatusSection from "@/features/admin/components/user-detail/AccountStatusSection";
import ClubMembershipsSection from "@/features/admin/components/user-detail/ClubMembershipsSection";
import DepartmentSection from "@/features/admin/components/user-detail/DepartmentSection";
import EffectivePermissionsSection from "@/features/admin/components/user-detail/EffectivePermissionsSection";
import GlobalRolesSection from "@/features/admin/components/user-detail/GlobalRolesSection";
import PermissionOverridesSection from "@/features/admin/components/user-detail/PermissionOverridesSection";
import { USER_STATUS_CHIP_CLASSES, USER_STATUS_LABELS } from "@/features/admin/labels";
import type { AdminUserDetail } from "@/shared/types";

function isAnonymized(user: AdminUserDetail): boolean {
  return !!user.deletedAt || user.email.endsWith("@anonim.invalid");
}

export default function UserDetailContent({
  universityId,
  user,
}: {
  universityId: string;
  user: AdminUserDetail;
}) {
  const { hasPermission } = useAuth();
  const anonymized = isAnonymized(user);

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-600 to-accent-400 text-lg font-bold text-white">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              (user.firstName[0] ?? "?").toLocaleUpperCase("tr-TR")
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-extrabold text-slate-900">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-sm text-slate-500">{user.email}</p>
            {user.studentNumber && (
              <p className="mt-1 text-xs text-slate-400">Öğrenci no: {user.studentNumber}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <span
                className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${USER_STATUS_CHIP_CLASSES[user.status]}`}
              >
                {USER_STATUS_LABELS[user.status]}
              </span>
              {anonymized && (
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                  Anonimleştirilmiş hesap
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="card space-y-6 p-5">
        <AccountStatusSection universityId={universityId} user={user} />
        {hasPermission("user.manage") && (
          <DepartmentSection universityId={universityId} user={user} />
        )}
        <GlobalRolesSection universityId={universityId} user={user} />
        <ClubMembershipsSection memberships={user.clubMemberships} />
        {hasPermission("permission.manage") && (
          <PermissionOverridesSection universityId={universityId} user={user} />
        )}
        <EffectivePermissionsSection permissions={user.effectivePermissions} />
      </section>
    </div>
  );
}
