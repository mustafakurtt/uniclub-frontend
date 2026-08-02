import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import {
  banUser,
  getUserModerationHistory,
  resetUserPassword,
  unbanUser,
} from "@/features/admin/api/userModeration";
import { USER_STATUS_LABELS } from "@/features/admin/labels";
import { canManageUser, outrankedReason, selfActionReason } from "@/features/admin/rank";
import { useRankActor } from "@/features/admin/useRankActor";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getErrorMessage } from "@/shared/api/client";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import EmptyState from "@/shared/ui/EmptyState";
import Modal from "@/shared/ui/Modal";
import { Icon } from "@/shared/ui/Icon";
import type { AdminUserDetail, ModerationHistoryItem } from "@/shared/types";
import MutationError from "./MutationError";
import { useInvalidateUserDetail } from "./useUserDetail";

const PAGE_SIZE = 20;

const banSchema = z.object({
  reason: z.string().trim().min(3, "Gerekçe en az 3 karakter olmalı.").max(500),
});
type BanFormValues = z.infer<typeof banSchema>;

const ACTION_LABELS: Record<ModerationHistoryItem["action"], string> = {
  ban: "Yasaklama",
  unban: "Yasak kaldırma",
  password_reset: "Şifre sıfırlama",
  anonymize: "Anonimleştirme",
};

function HistoryRow({ item }: { item: ModerationHistoryItem }) {
  const actorName = item.actor
    ? `${item.actor.firstName} ${item.actor.lastName}`
    : item.actorId;

  return (
    <li className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
          {ACTION_LABELS[item.action] ?? item.action}
        </span>
        <span className="text-xs text-slate-400">
          {new Date(item.createdAt).toLocaleString("tr-TR")}
        </span>
      </div>
      <p className="text-xs text-slate-500">
        İşlemi yapan: <span className="font-semibold text-slate-700">{actorName}</span>
      </p>
      {item.reason && <p className="text-xs text-slate-600">Gerekçe: {item.reason}</p>}
      {(item.previousStatus || item.newStatus) && (
        <p className="text-xs text-slate-400">
          Durum:{" "}
          {item.previousStatus ? USER_STATUS_LABELS[item.previousStatus] : "—"} →{" "}
          {item.newStatus ? USER_STATUS_LABELS[item.newStatus] : "—"}
        </p>
      )}
    </li>
  );
}

interface Props {
  universityId: string;
  user: AdminUserDetail;
  enabled: boolean;
}

export default function UserModerationTab({ universityId, user, enabled }: Props) {
  const { hasPermission } = useAuth();
  const actor = useRankActor();
  const invalidate = useInvalidateUserDetail(universityId, user.id);
  const displayName = `${user.firstName} ${user.lastName}`;

  const canViewHistory = hasPermission("user.view");
  const canModerate = hasPermission("user.manage");

  const isSelf = user.id === actor.userId;
  const blockedReason = isSelf
    ? selfActionReason
    : !canManageUser(actor, user)
      ? outrankedReason
      : null;
  const canAct = canModerate && !blockedReason;

  const [banOpen, setBanOpen] = useState(false);
  const [unbanOpen, setUnbanOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const banForm = useForm<BanFormValues>({
    resolver: zodResolver(banSchema),
    defaultValues: { reason: "" },
  });

  const historyQuery = useInfiniteQuery({
    queryKey: ["moderation", universityId, user.id, "history"],
    queryFn: ({ pageParam }) =>
      getUserModerationHistory(universityId, user.id, {
        limit: PAGE_SIZE,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: enabled && canViewHistory,
  });

  const banMutation = useMutation({
    mutationFn: (values: BanFormValues) => banUser(universityId, user.id, values),
    onSuccess: () => {
      invalidate();
      historyQuery.refetch();
      setBanOpen(false);
      banForm.reset();
    },
  });

  const unbanMutation = useMutation({
    mutationFn: () => unbanUser(universityId, user.id),
    onSuccess: () => {
      invalidate();
      historyQuery.refetch();
      setUnbanOpen(false);
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => resetUserPassword(universityId, user.id),
    onSuccess: (result) => {
      historyQuery.refetch();
      setResetOpen(false);
      setTempPassword(result.temporaryPassword);
    },
  });

  const history = historyQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const isSuspended = user.status === "suspended";

  return (
    <div className="space-y-6">
      {canAct && (
        <section>
          <h3 className="input-label">İşlemler</h3>
          <MutationError
            error={banMutation.error ?? unbanMutation.error ?? resetMutation.error}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {!isSuspended && (
              <button type="button" className="btn-secondary text-xs" onClick={() => setBanOpen(true)}>
                <Icon name="moderation" size={14} /> Yasakla
              </button>
            )}
            {isSuspended && (
              <button type="button" className="btn-secondary text-xs" onClick={() => setUnbanOpen(true)}>
                <Icon name="moderation" size={14} /> Yasağı Kaldır
              </button>
            )}
            <button type="button" className="btn-ghost text-xs" onClick={() => setResetOpen(true)}>
              <Icon name="lock" size={14} /> Şifre Sıfırla
            </button>
          </div>
        </section>
      )}

      {canModerate && isSelf && (
        <p className="text-xs text-slate-400">{selfActionReason}</p>
      )}

      {canViewHistory && (
        <section>
          <h3 className="input-label">Moderasyon Geçmişi</h3>
          {historyQuery.isLoading ? (
            <div className="space-y-2">
              <div className="skeleton h-12 w-full" />
              <div className="skeleton h-12 w-full" />
            </div>
          ) : historyQuery.isError ? (
            <div className="alert-error">
              {getErrorMessage(historyQuery.error, "Moderasyon geçmişi yüklenemedi.")}
            </div>
          ) : history.length === 0 ? (
            <EmptyState icon="moderation" title="Moderasyon kaydı yok" />
          ) : (
            <>
              <ul className="mt-2">
                {history.map((item) => (
                  <HistoryRow key={item.id} item={item} />
                ))}
              </ul>
              {historyQuery.hasNextPage && (
                <button
                  type="button"
                  className="btn-ghost mt-3 text-xs"
                  disabled={historyQuery.isFetchingNextPage}
                  onClick={() => historyQuery.fetchNextPage()}
                >
                  {historyQuery.isFetchingNextPage ? "Yükleniyor…" : "Daha fazla"}
                </button>
              )}
            </>
          )}
        </section>
      )}

      {!canViewHistory && !canAct && (
        <p className="text-xs text-slate-400">Bu bölümü görüntüleme yetkin yok.</p>
      )}

      <ConfirmDialog
        open={banOpen}
        title={`${displayName} yasaklansın mı?`}
        description={
          <>
            <p className="mb-2">
              <span className="font-semibold">{displayName}</span> hesabı askıya alınacak ve tüm
              aktif oturumları anında sonlandırılacak.
            </p>
            <form
              id="ban-user-form"
              onSubmit={banForm.handleSubmit((values) => banMutation.mutate(values))}
              className="space-y-2"
            >
              <label className="input-label" htmlFor="ban-reason">
                Gerekçe (zorunlu)
              </label>
              <textarea
                id="ban-reason"
                {...banForm.register("reason")}
                className="input-field min-h-[80px] text-sm"
                placeholder="Yasaklama gerekçesi…"
              />
              {banForm.formState.errors.reason && (
                <p className="input-error">{banForm.formState.errors.reason.message}</p>
              )}
            </form>
          </>
        }
        confirmLabel="Yasakla"
        loading={banMutation.isPending}
        error={banMutation.isError ? getErrorMessage(banMutation.error, "Yasaklama başarısız.") : null}
        onConfirm={() => {
          void banForm.handleSubmit((values) => banMutation.mutate(values))();
        }}
        onClose={() => {
          setBanOpen(false);
          banMutation.reset();
          banForm.reset();
        }}
      />

      <ConfirmDialog
        open={unbanOpen}
        title={`${displayName} için yasak kaldırılsın mı?`}
        description={
          <p>
            <span className="font-semibold">{displayName}</span> hesabının askısı kaldırılacak ve
            hesap yeniden giriş yapabilecek.
          </p>
        }
        confirmLabel="Yasağı Kaldır"
        tone="primary"
        loading={unbanMutation.isPending}
        error={
          unbanMutation.isError ? getErrorMessage(unbanMutation.error, "İşlem başarısız.") : null
        }
        onConfirm={() => unbanMutation.mutate()}
        onClose={() => {
          setUnbanOpen(false);
          unbanMutation.reset();
        }}
      />

      <ConfirmDialog
        open={resetOpen}
        title={`${displayName} için şifre sıfırlansın mı?`}
        description={
          <p>
            <span className="font-semibold">{displayName}</span> için yeni bir geçici şifre
            oluşturulacak. Tüm aktif oturumları anında sonlandırılacak. Geçici şifre yalnızca bir
            kez gösterilir — güvenli bir kanaldan iletin.
          </p>
        }
        confirmLabel="Şifreyi Sıfırla"
        tone="primary"
        loading={resetMutation.isPending}
        error={
          resetMutation.isError ? getErrorMessage(resetMutation.error, "Sıfırlama başarısız.") : null
        }
        onConfirm={() => resetMutation.mutate()}
        onClose={() => {
          setResetOpen(false);
          resetMutation.reset();
        }}
      />

      <Modal
        open={!!tempPassword}
        onClose={() => setTempPassword(null)}
        title={`${displayName} — geçici şifre`}
        description="Bu şifre yalnızca bir kez gösterilir. Kullanıcıya güvenli bir kanaldan iletin."
        size="sm"
        footer={
          <button type="button" className="btn-primary" onClick={() => setTempPassword(null)}>
            Tamam
          </button>
        }
      >
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center font-mono text-lg font-bold tracking-wide text-slate-900">
          {tempPassword}
        </p>
      </Modal>
    </div>
  );
}
