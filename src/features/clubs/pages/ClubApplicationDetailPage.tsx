import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyClubApplication,
  getMyClubApplicationHistory,
  resubmitClubApplication,
} from "@/features/clubs/api/clubs";
import ClubApplicationAppealSection from "@/features/clubs/components/ClubApplicationAppealSection";
import ClubApplicationEventTimeline from "@/features/clubs/components/ClubApplicationEventTimeline";
import ClubApplicationResubmitForm from "@/features/clubs/components/ClubApplicationResubmitForm";
import ClubApplicationApprovalChain from "@/features/admin/components/ClubApplicationApprovalChain";
import {
  APPLICATION_STATUS_CHIP,
  APPLICATION_STATUS_LABELS,
} from "@/features/clubs/applicationLabels";
import { getStudentApplicationStatusLine } from "@/features/clubs/applicationStatus";
import { approverRoleLabel } from "@/features/admin/labels";
import PageLoader from "@/shared/ui/PageLoader";
import { Icon } from "@/shared/ui/Icon";
import type { ClubApplicationHistory } from "@/shared/types";

function resolveHistory(
  embedded: ClubApplicationHistory | null,
  fetched: ClubApplicationHistory | undefined
): ClubApplicationHistory | null {
  return embedded ?? fetched ?? null;
}

export default function ClubApplicationDetailPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const queryClient = useQueryClient();
  const [resubmitted, setResubmitted] = useState(false);

  const detailQuery = useQuery({
    queryKey: ["club-application", applicationId],
    queryFn: () => getMyClubApplication(applicationId!),
    enabled: !!applicationId,
  });

  const application = detailQuery.data;
  const hasEmbeddedHistory =
    application?.events !== undefined && application.revisionRequestCount !== undefined;

  const embeddedHistory = useMemo((): ClubApplicationHistory | null => {
    if (!application || !hasEmbeddedHistory) return null;
    return {
      applicationId: application.id,
      revisionRequestCount: application.revisionRequestCount!,
      events: application.events!,
    };
  }, [application, hasEmbeddedHistory]);

  const historyQuery = useQuery({
    queryKey: ["club-application-history", applicationId],
    queryFn: () => getMyClubApplicationHistory(applicationId!),
    enabled: !!applicationId && !!application && !hasEmbeddedHistory,
    retry: false,
  });

  const resubmitMutation = useMutation({
    mutationFn: (values: { proposedName: string; description?: string }) =>
      resubmitClubApplication(applicationId!, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["club-application", applicationId] });
      await queryClient.invalidateQueries({ queryKey: ["club-application-history", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      setResubmitted(true);
    },
  });

  if (!applicationId) {
    return <div className="alert-error">Geçersiz başvuru bağlantısı.</div>;
  }

  if (detailQuery.isLoading) {
    return <PageLoader label="Başvuru yükleniyor…" />;
  }

  if (detailQuery.isError || !application) {
    return (
      <div className="card p-8 text-center">
        <Icon name="notFound" size={40} className="mx-auto mb-3 text-slate-400" />
        <p className="font-semibold text-slate-700">Başvuru bulunamadı.</p>
        <Link to="/dashboard" className="btn-ghost mt-4 inline-flex">
          Panele dön
        </Link>
      </div>
    );
  }

  const revision = application.revisionRequest;
  const showResubmit = application.status === "revision_requested" && revision;
  const statusLine = getStudentApplicationStatusLine(application);
  const history = resolveHistory(embeddedHistory, historyQuery.data);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/dashboard" className="btn-ghost mb-4 px-0 text-sm">
          <Icon name="arrowLeft" size={14} /> Panele dön
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-extrabold text-slate-900">
            {application.proposedName}
          </h1>
          <span className={`chip ${APPLICATION_STATUS_CHIP[application.status]}`}>
            {APPLICATION_STATUS_LABELS[application.status]}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Başvuru tarihi: {new Date(application.createdAt).toLocaleString("tr-TR")}
          {application.updatedAt !== application.createdAt && (
            <> · Son güncelleme: {new Date(application.updatedAt).toLocaleString("tr-TR")}</>
          )}
        </p>
      </div>

      <section className="card border-brand-200 bg-brand-50/60 p-5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-600">Şu an</p>
        <p className="mt-1 font-display text-lg font-bold text-slate-900">{statusLine}</p>
        {application.approvals.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">
            Onay kademesi: {application.approvals.length}
            {application.approvals.filter((a) => a.status === "approved").length > 0 && (
              <>
                {" "}
                · {application.approvals.filter((a) => a.status === "approved").length} tamamlandı
              </>
            )}
          </p>
        )}
      </section>

      {resubmitted && application.status === "pending" && (
        <div className="alert-success flex items-start gap-3 text-sm">
          <Icon name="check" size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Başvurun yeniden gönderildi.</p>
            <p className="mt-0.5 text-slate-600">
              Değerlendirme süreci kaldığı yerden devam ediyor; onaylanmış kademeler geçerliliğini korur.
            </p>
          </div>
        </div>
      )}

      {revision && (
        <section className="card border-violet-100 bg-violet-50/50 p-5">
          <div className="flex items-start gap-3">
            <span className="icon-tile shrink-0">
              <Icon name="edit" size={22} className="text-violet-600" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-base font-bold text-slate-900">Düzeltme talebi</h2>
              <p className="mt-1 text-xs text-slate-500">
                Kademe {revision.step} ·{" "}
                {approverRoleLabel(
                  application.approvals.find((a) => a.step === revision.step)?.approverRole ?? ""
                )}{" "}
                · {new Date(revision.requestedAt).toLocaleString("tr-TR")}
              </p>
              {revision.requestedBy && (
                <p className="mt-1 text-xs text-slate-500">
                  Talep eden: {revision.requestedBy.firstName} {revision.requestedBy.lastName}
                </p>
              )}
              <blockquote className="mt-3 rounded-xl border border-violet-100 bg-white px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap">
                {revision.note}
              </blockquote>
            </div>
          </div>
        </section>
      )}

      {showResubmit ? (
        <ClubApplicationResubmitForm
          defaultValues={{
            proposedName: application.proposedName,
            description: application.description ?? "",
          }}
          revisionNote={revision.note}
          revisionStep={revision.step}
          loading={resubmitMutation.isPending}
          error={resubmitMutation.error}
          onSubmit={(values) =>
            resubmitMutation.mutate({
              proposedName: values.proposedName,
              description: values.description || undefined,
            })
          }
        />
      ) : (
        <>
          <section className="card p-5 space-y-3">
            <h2 className="font-display text-base font-bold text-slate-900">Onay süreci</h2>
            <ClubApplicationApprovalChain approvals={application.approvals} showAllSteps />
          </section>

          <ClubApplicationAppealSection applicationId={applicationId} application={application} />

          <section className="card p-5 space-y-3">
            <h2 className="font-display text-base font-bold text-slate-900">Başvuru özeti</h2>
            {application.description ? (
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{application.description}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">Açıklama eklenmemiş.</p>
            )}
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-display text-base font-bold text-slate-900">Süreç geçmişi</h2>
            {historyQuery.isLoading && !history ? (
              <div className="space-y-3">
                <div className="skeleton h-14 w-full" />
                <div className="skeleton h-14 w-full" />
              </div>
            ) : historyQuery.isError && !history ? (
              <p className="text-sm text-slate-500">
                Olay geçmişi henüz yüklenemedi. Onay adımları yukarıda güncel durumu gösterir.
              </p>
            ) : history ? (
              <ClubApplicationEventTimeline history={history} compact />
            ) : (
              <p className="text-sm text-slate-500">Henüz kayıtlı süreç olayı yok.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
