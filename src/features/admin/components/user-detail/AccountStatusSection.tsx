// Hesap durumu (askı) — `user.manage` + rütbe üstünlüğü.
// Kendini askıya alma ve eşit/üst rütbeli kullanıcıya dokunma backend'de 400
// döner (FRONTEND_RUTBE_VE_PLATFORM.md §4/§5); burada önden disable ediyoruz.
import { useMutation } from "@tanstack/react-query";
import SelectField from "@/shared/ui/SelectField";
import { updateUserStatus } from "@/features/admin/api";
import { USER_STATUS_CHIP_CLASSES, USER_STATUS_LABELS } from "@/features/admin/labels";
import { canManageUser, outrankedReason, selfActionReason } from "@/features/admin/rank";
import { useRankActor } from "@/features/admin/useRankActor";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { AdminUserDetail, UserStatus } from "@/shared/types";
import MutationError from "./MutationError";
import { useInvalidateUserDetail } from "./useUserDetail";

const STATUS_ORDER: UserStatus[] = ["pending", "active", "suspended"];

interface Props {
  universityId: string;
  user: AdminUserDetail;
}

export default function AccountStatusSection({ universityId, user }: Props) {
  const { hasPermission } = useAuth();
  const actor = useRankActor();
  const invalidate = useInvalidateUserDetail(universityId, user.id);

  const statusMutation = useMutation({
    mutationFn: (status: UserStatus) => updateUserStatus(universityId, user.id, status),
    onSuccess: invalidate,
  });

  const isSelf = user.id === actor.userId;
  // Durum değiştirme kendine kapalıdır; super_admin muafiyeti burada geçmez
  // (backend "kendinizi askıya alamazsınız" der), bu yüzden isSelf ayrı bakılır.
  const blockedReason = isSelf
    ? selfActionReason
    : !canManageUser(actor, user)
      ? outrankedReason
      : null;
  const canEdit = hasPermission("user.manage") && !blockedReason;

  return (
    <section>
      <MutationError error={statusMutation.error} />
      <div className="mb-2 flex items-center justify-between">
        <h3 className="input-label mb-0">Hesap Durumu</h3>
        <span
          className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${USER_STATUS_CHIP_CLASSES[user.status]}`}
        >
          {USER_STATUS_LABELS[user.status]}
        </span>
      </div>
      {canEdit ? (
        <SelectField
          className="select-field text-sm"
          value={user.status}
          disabled={statusMutation.isPending}
          onChange={(e) => statusMutation.mutate(e.target.value as UserStatus)}
          aria-label="Hesap durumu"
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {USER_STATUS_LABELS[s]}
            </option>
          ))}
        </SelectField>
      ) : (
        <p className="text-xs text-slate-400">
          {blockedReason ?? "Durum değiştirme yetkin yok."}
        </p>
      )}
      {user.status === "suspended" && (
        <p className="mt-1.5 text-xs text-red-500">
          Askıya alınan kullanıcının oturumu bir sonraki istekte anında kesilir.
        </p>
      )}
    </section>
  );
}
