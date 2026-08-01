import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  acceptAdvisorInvitation,
  declineAdvisorInvitation,
  getMyAdvisorInvitations,
  withdrawFromAdvisedClub,
} from "@/features/auth/api/advisorInvitations";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { invitationDaysRemainingLabel } from "@/features/clubs/advisorInvitationLabels";
import { getErrorMessage } from "@/shared/api/client";
import Modal from "@/shared/ui/Modal";
import { Icon } from "@/shared/ui/Icon";
import type { AdvisedClub } from "@/shared/types";

const reasonSchema = z.object({
  reason: z.string().trim().min(1, "Gerekçe zorunludur.").max(2000, "En fazla 2000 karakter."),
});

type ReasonFormValues = z.infer<typeof reasonSchema>;

function DeclineInvitationDialog({
  open,
  loading,
  error,
  onConfirm,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  error: string | null;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReasonFormValues>({
    resolver: zodResolver(reasonSchema),
    defaultValues: { reason: "" },
  });

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : () => { reset(); onClose(); }}
      title="Daveti reddet"
      description="Ret gerekçesi zorunludur ve kayıt altına alınır."
      size="sm"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={() => { reset(); onClose(); }} disabled={loading}>
            Vazgeç
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-60"
            onClick={handleSubmit((v) => onConfirm(v.reason))}
            disabled={loading}
          >
            {loading ? "İşleniyor..." : "Reddet"}
          </button>
        </>
      }
    >
      {error && <div className="alert-error mb-4">{error}</div>}
      <div>
        <label className="input-label" htmlFor="decline-reason">
          Gerekçe
        </label>
        <textarea
          id="decline-reason"
          rows={4}
          className="input-field min-h-[6rem] resize-y"
          {...register("reason")}
        />
        {errors.reason && <p className="input-error">{errors.reason.message}</p>}
      </div>
    </Modal>
  );
}

function WithdrawDialog({
  open,
  clubName,
  loading,
  error,
  onConfirm,
  onClose,
}: {
  open: boolean;
  clubName: string;
  loading: boolean;
  error: string | null;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReasonFormValues>({
    resolver: zodResolver(reasonSchema),
    defaultValues: { reason: "" },
  });

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : () => { reset(); onClose(); }}
      title="Danışmanlıktan çekil"
      description={
        <>
          <strong>{clubName}</strong> kulübündeki danışmanlığınız sona erecek. Bu işlem geri
          alınamaz.
        </>
      }
      size="sm"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={() => { reset(); onClose(); }} disabled={loading}>
            Vazgeç
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-60"
            onClick={handleSubmit((v) => onConfirm(v.reason))}
            disabled={loading}
          >
            {loading ? "İşleniyor..." : "Çekil"}
          </button>
        </>
      }
    >
      {error && <div className="alert-error mb-4">{error}</div>}
      <div>
        <label className="input-label" htmlFor="withdraw-reason">
          Gerekçe
        </label>
        <textarea
          id="withdraw-reason"
          rows={4}
          className="input-field min-h-[6rem] resize-y"
          placeholder="Neden görevden çekildiğinizi kısaca açıklayın…"
          {...register("reason")}
        />
        {errors.reason && <p className="input-error">{errors.reason.message}</p>}
      </div>
    </Modal>
  );
}

export default function AdvisorAdvisoryPanel() {
  const queryClient = useQueryClient();
  const { advisedClubs } = useAuth();
  const [declineTarget, setDeclineTarget] = useState<string | null>(null);
  const [withdrawTarget, setWithdrawTarget] = useState<AdvisedClub | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const invitationsQuery = useQuery({
    queryKey: ["my-advisor-invitations"],
    queryFn: getMyAdvisorInvitations,
  });

  const invitations = invitationsQuery.data ?? [];
  const hasContent = invitations.length > 0 || advisedClubs.length > 0;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["my-advisor-invitations"] });
    queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    queryClient.invalidateQueries({ queryKey: ["auth", "permissions"] });
    queryClient.invalidateQueries({ queryKey: ["auth", "advisedClubs"] });
  };

  const acceptMutation = useMutation({
    mutationFn: acceptAdvisorInvitation,
    onSuccess: invalidateAll,
    onError: (e) => setActionError(getErrorMessage(e, "Davet kabul edilemedi.")),
  });

  const declineMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      declineAdvisorInvitation(id, { reason }),
    onSuccess: () => {
      invalidateAll();
      setDeclineTarget(null);
      setActionError(null);
    },
    onError: (e) => setActionError(getErrorMessage(e, "Davet reddedilemedi.")),
  });

  const withdrawMutation = useMutation({
    mutationFn: ({ clubId, reason }: { clubId: string; reason: string }) =>
      withdrawFromAdvisedClub(clubId, { reason }),
    onSuccess: () => {
      invalidateAll();
      setWithdrawTarget(null);
      setActionError(null);
    },
    onError: (e) => setActionError(getErrorMessage(e, "Çekilme işlemi tamamlanamadı.")),
  });

  if (invitationsQuery.isLoading) {
    return null;
  }

  if (!hasContent) {
    return null;
  }

  return (
    <section className="card-gradient p-8 space-y-6">
      <div className="flex items-center gap-4">
        <div className="icon-tile">
          <Icon name="advisor" size={22} className="text-brand-600" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">Danışmanlık davetlerim</h2>
          <p className="text-xs text-slate-500">
            Kulüp danışmanlığı davetlerini buradan yanıtlayabilir; aktif danışmanlıklarınızı
            yönetebilirsiniz.
          </p>
        </div>
      </div>

      {actionError && !declineTarget && !withdrawTarget && (
        <div className="alert-error text-sm">{actionError}</div>
      )}

      {invitations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Bekleyen davetler</h3>
          <ul className="space-y-3">
            {invitations.map((inv) => (
              <li key={inv.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display font-bold text-slate-900">
                      {inv.club?.name ?? "Kulüp"}
                    </p>
                    {inv.inviter && (
                      <p className="mt-1 text-xs text-slate-500">
                        Davet eden: {inv.inviter.firstName} {inv.inviter.lastName}
                      </p>
                    )}
                    {inv.message && (
                      <blockquote className="mt-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600 whitespace-pre-wrap">
                        {inv.message}
                      </blockquote>
                    )}
                    <p className="mt-2 text-xs font-semibold text-amber-700">
                      {invitationDaysRemainingLabel(inv.expiresAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      className="btn-primary text-xs"
                      disabled={acceptMutation.isPending}
                      onClick={() => {
                        setActionError(null);
                        acceptMutation.mutate(inv.id);
                      }}
                    >
                      Kabul et
                    </button>
                    <button
                      type="button"
                      className="btn-ghost text-xs text-red-600"
                      onClick={() => {
                        setActionError(null);
                        setDeclineTarget(inv.id);
                      }}
                    >
                      Ret
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {advisedClubs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Danışmanı olduğum kulüpler</h3>
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white/80">
            {advisedClubs.map((row) => (
              <li
                key={row.clubId}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <Link
                    to={`/clubs/${row.clubId}`}
                    className="text-sm font-bold text-slate-900 hover:text-brand-700"
                  >
                    {row.club.name}
                  </Link>
                  <p className="text-xs text-slate-400">/{row.club.slug}</p>
                </div>
                <button
                  type="button"
                  className="btn-ghost text-xs text-red-600"
                  onClick={() => {
                    setActionError(null);
                    setWithdrawTarget(row);
                  }}
                >
                  Görevden çekil
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <DeclineInvitationDialog
        open={Boolean(declineTarget)}
        loading={declineMutation.isPending}
        error={actionError}
        onConfirm={(reason) => {
          if (declineTarget) declineMutation.mutate({ id: declineTarget, reason });
        }}
        onClose={() => {
          setDeclineTarget(null);
          setActionError(null);
        }}
      />

      <WithdrawDialog
        open={Boolean(withdrawTarget)}
        clubName={withdrawTarget?.club.name ?? ""}
        loading={withdrawMutation.isPending}
        error={actionError}
        onConfirm={(reason) => {
          if (withdrawTarget) {
            withdrawMutation.mutate({ clubId: withdrawTarget.clubId, reason });
          }
        }}
        onClose={() => {
          setWithdrawTarget(null);
          setActionError(null);
        }}
      />
    </section>
  );
}
