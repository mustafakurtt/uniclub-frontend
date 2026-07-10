// Kullanıcı detay + yönetim kabuğu (docs/FRONTEND_YONETIM.md §5.1/§6).
// Bu dosya yalnızca modal kabuğu + detay sorgusudur; her bölüm kendi
// mutasyonunu ve yetki kontrolünü taşır. Bölümlerin yetki eşlemesi:
//   • AccountStatusSection / DepartmentSection  → user.manage
//   • GlobalRolesSection                        → role.manage
//   • PermissionOverridesSection                → permission.manage (super_admin)
//   • ClubMemberships / EffectivePermissions    → salt bilgi
// Gösterim UX'tir; gerçek kontrol her zaman backend'dedir.
import { getErrorMessage } from "@/shared/api/client";
import Modal from "@/shared/ui/Modal";
import { useAuth } from "@/features/auth/hooks/useAuth";
import AccountStatusSection from "./AccountStatusSection";
import ClubMembershipsSection from "./ClubMembershipsSection";
import DepartmentSection from "./DepartmentSection";
import EffectivePermissionsSection from "./EffectivePermissionsSection";
import GlobalRolesSection from "./GlobalRolesSection";
import PermissionOverridesSection from "./PermissionOverridesSection";
import { useUserDetailQuery } from "./useUserDetail";

interface UserDetailModalProps {
  open: boolean;
  universityId: string;
  userId: string | null;
  onClose: () => void;
}

export default function UserDetailModal({
  open,
  universityId,
  userId,
  onClose,
}: UserDetailModalProps) {
  const { hasPermission } = useAuth();
  const detailQuery = useUserDetailQuery(universityId, userId, open);
  const user = detailQuery.data;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={user ? `${user.firstName} ${user.lastName}` : "Kullanıcı"}
      description={user?.email}
      footer={
        <button type="button" className="btn-ghost" onClick={onClose}>
          Kapat
        </button>
      }
    >
      {detailQuery.isLoading ? (
        <div className="space-y-3">
          <div className="skeleton h-16 w-full" />
          <div className="skeleton h-24 w-full" />
        </div>
      ) : detailQuery.isError || !user ? (
        <div className="alert-error">
          {getErrorMessage(detailQuery.error, "Kullanıcı yüklenemedi.")}
        </div>
      ) : (
        <div className="space-y-6">
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
        </div>
      )}
    </Modal>
  );
}
