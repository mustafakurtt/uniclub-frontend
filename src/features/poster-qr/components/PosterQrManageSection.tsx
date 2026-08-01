import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelClubPosterQr,
  cancelUniversityPosterQr,
  createClubPosterQr,
  createUniversityPosterQr,
  listClubPosterQr,
  listUniversityPosterQr,
  updateClubPosterQr,
  updateUniversityPosterQr,
} from "@/features/poster-qr/api/posterQr";
import { getClubActivities } from "@/features/activities/api/activities";
import { getAdminClubs } from "@/features/admin/api/clubs";
import PosterQrAnalyticsOverview from "@/features/poster-qr/components/analytics/PosterQrAnalyticsOverview";
import PosterQrCodeAnalyticsModal from "@/features/poster-qr/components/analytics/PosterQrCodeAnalyticsModal";
import PosterQrCreateModal from "@/features/poster-qr/components/PosterQrCreateModal";
import PosterQrRetargetModal from "@/features/poster-qr/components/PosterQrRetargetModal";
import PosterQrPrintSheet from "@/features/poster-qr/components/PosterQrPrintSheet";
import PosterQrListTable from "@/features/poster-qr/components/PosterQrListTable";
import { getErrorMessage } from "@/shared/api/client";
import EmptyState from "@/shared/ui/EmptyState";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import { Icon } from "@/shared/ui/Icon";
import type { PosterQrCode, PosterQrOverviewAnalytics } from "@/shared/types";

interface PosterQrManageSectionProps {
  scope: "club" | "university";
  clubId?: string;
  universityId?: string;
  universityName?: string;
}

export default function PosterQrManageSection({
  scope,
  clubId,
  universityId,
  universityName,
}: PosterQrManageSectionProps) {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [retargeting, setRetargeting] = useState<PosterQrCode | null>(null);
  const [printing, setPrinting] = useState<PosterQrCode | null>(null);
  const [cancelling, setCancelling] = useState<PosterQrCode | null>(null);
  const [analyticsCode, setAnalyticsCode] = useState<{ qrId: string; sourceLabel: string } | null>(
    null
  );
  const [actionError, setActionError] = useState<string | null>(null);

  const queryKey =
    scope === "club" ? ["clubs", clubId, "poster-qr"] : ["universities", universityId, "poster-qr"];

  const analyticsQueryKey =
    scope === "club"
      ? ["clubs", clubId, "poster-qr", "analytics"]
      : ["universities", universityId, "poster-qr", "analytics"];

  const listQuery = useQuery({
    queryKey,
    queryFn: () =>
      scope === "club" ? listClubPosterQr(clubId!) : listUniversityPosterQr(universityId!),
    enabled: scope === "club" ? !!clubId : !!universityId,
  });

  const analyticsTimezone =
    queryClient.getQueryData<PosterQrOverviewAnalytics>(analyticsQueryKey)?.timezone ?? null;

  const clubsQuery = useQuery({
    queryKey: ["admin", universityId, "clubs", "approved"],
    queryFn: () => getAdminClubs(universityId!, "approved"),
    enabled: scope === "university" && !!universityId,
  });

  const clubActivitiesQuery = useQuery({
    queryKey: ["clubs", clubId, "activities"],
    queryFn: () => getClubActivities(clubId!),
    enabled: scope === "club" && !!clubId,
  });

  const targetLabels = useMemo(() => {
    const map = new Map<string, string>();
    clubsQuery.data?.forEach((c) => map.set(c.id, c.name));
    clubActivitiesQuery.data?.forEach((a) => map.set(a.id, a.title));
    listQuery.data?.forEach((qr) => {
      if (qr.targetClubId && !map.has(qr.targetClubId)) {
        map.set(qr.targetClubId, `Kulüp #${qr.targetClubId.slice(0, 8)}`);
      }
      if (qr.targetActivityId && !map.has(qr.targetActivityId)) {
        map.set(qr.targetActivityId, `Etkinlik #${qr.targetActivityId.slice(0, 8)}`);
      }
    });
    return map;
  }, [clubsQuery.data, clubActivitiesQuery.data, listQuery.data]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: analyticsQueryKey });
  };

  const createMutation = useMutation({
    mutationFn: (dto: Parameters<typeof createClubPosterQr>[1]) =>
      scope === "club"
        ? createClubPosterQr(clubId!, dto)
        : createUniversityPosterQr(universityId!, dto),
    onSuccess: () => {
      setActionError(null);
      setCreating(false);
      invalidate();
    },
    onError: (err) => setActionError(getErrorMessage(err, "Oluşturulamadı.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ qrId, dto }: { qrId: string; dto: Parameters<typeof updateClubPosterQr>[2] }) =>
      scope === "club"
        ? updateClubPosterQr(clubId!, qrId, dto)
        : updateUniversityPosterQr(universityId!, qrId, dto),
    onSuccess: () => {
      setActionError(null);
      setRetargeting(null);
      invalidate();
    },
    onError: (err) => setActionError(getErrorMessage(err, "Güncellenemedi.")),
  });

  const cancelMutation = useMutation({
    mutationFn: (qrId: string) =>
      scope === "club"
        ? cancelClubPosterQr(clubId!, qrId)
        : cancelUniversityPosterQr(universityId!, qrId),
    onSuccess: () => {
      setCancelling(null);
      invalidate();
    },
  });

  const resolveTargetLabel = (qr: PosterQrCode) => {
    const id = qr.targetType === "club" ? qr.targetClubId : qr.targetActivityId;
    return id ? (targetLabels.get(id) ?? id) : "—";
  };

  return (
    <section className="card p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Afiş QR Kodları</h2>
          <p className="mt-1 text-sm text-slate-500">
            Pano ve afişler için sabit QR kodları. Hedefi sonradan değiştirebilirsiniz — basılı
            afiş çöpe gitmez.
          </p>
        </div>
        <button type="button" className="btn-secondary text-xs" onClick={() => setCreating(true)}>
          <Icon name="add" size={14} /> Kod Oluştur
        </button>
      </div>

      <PosterQrAnalyticsOverview
        scope={scope}
        clubId={clubId}
        universityId={universityId}
        targetLabels={targetLabels}
        onSelectCode={(qrId, sourceLabel) => setAnalyticsCode({ qrId, sourceLabel })}
      />

      <h3 className="mb-3 font-display text-sm font-bold text-slate-900">Kod listesi</h3>

      {listQuery.isLoading ? (
        <div className="skeleton h-24 w-full" />
      ) : listQuery.isError ? (
        <div className="alert-error">{getErrorMessage(listQuery.error, "Liste yüklenemedi.")}</div>
      ) : (listQuery.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon="link"
          title="Henüz afiş QR kodu yok"
          description="Kampüs panoları için bir kod oluşturun."
        />
      ) : (
        <PosterQrListTable
          codes={listQuery.data!}
          resolveTargetLabel={resolveTargetLabel}
          onPrint={setPrinting}
          onRetarget={setRetargeting}
          onCancel={setCancelling}
          onAnalytics={(qr) => setAnalyticsCode({ qrId: qr.id, sourceLabel: qr.sourceLabel })}
        />
      )}

      <PosterQrCreateModal
        open={creating}
        scope={scope}
        clubId={clubId}
        universityId={universityId}
        loading={createMutation.isPending}
        error={actionError}
        onSubmit={async (dto) => {
          await createMutation.mutateAsync(dto);
        }}
        onClose={() => {
          setCreating(false);
          setActionError(null);
          createMutation.reset();
        }}
      />

      <PosterQrRetargetModal
        open={!!retargeting}
        qr={retargeting}
        scope={scope}
        clubId={clubId}
        universityId={universityId}
        loading={updateMutation.isPending}
        error={actionError}
        onSubmit={async (dto) => {
          if (!retargeting) return;
          await updateMutation.mutateAsync({ qrId: retargeting.id, dto });
        }}
        onClose={() => {
          setRetargeting(null);
          setActionError(null);
          updateMutation.reset();
        }}
      />

      {printing && (
        <PosterQrPrintSheet
          qr={printing}
          targetLabel={resolveTargetLabel(printing)}
          universityName={universityName}
          onClose={() => setPrinting(null)}
        />
      )}

      <PosterQrCodeAnalyticsModal
        open={!!analyticsCode}
        scope={scope}
        clubId={clubId}
        universityId={universityId}
        qrId={analyticsCode?.qrId ?? null}
        sourceLabel={analyticsCode?.sourceLabel ?? ""}
        timezone={analyticsTimezone}
        onClose={() => setAnalyticsCode(null)}
      />

      <ConfirmDialog
        open={!!cancelling}
        title={`"${cancelling?.sourceLabel}" iptal edilsin mi?`}
        description="QR kodu artık yönlendirme yapmaz. Basılı afişler taramada 'iptal edildi' mesajı görür."
        confirmLabel="İptal Et"
        loading={cancelMutation.isPending}
        onConfirm={() => cancelling && cancelMutation.mutate(cancelling.id)}
        onClose={() => setCancelling(null)}
      />
    </section>
  );
}
