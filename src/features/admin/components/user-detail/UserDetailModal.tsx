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
import UserDetailContent from "./UserDetailContent";
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
        <UserDetailContent universityId={universityId} user={user} />
      )}
    </Modal>
  );
}
