import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatActivityDateTime } from "@/features/activities/formatActivityDateTime";
import { getGeneralMeeting, listGeneralMeetings } from "@/features/clubs/api/generalMeetings";
import CreateGeneralMeetingModal from "@/features/clubs/components/CreateGeneralMeetingModal";
import GeneralMeetingDetailPanel from "@/features/clubs/components/GeneralMeetingDetailPanel";
import { GENERAL_MEETING_TYPE_LABELS } from "@/features/clubs/generalMeetingLabels";
import { useTenantTimezone } from "@/features/auth/hooks/useTenantTimezone";
import { getErrorMessage } from "@/shared/api/client";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import type { ClubMemberRow } from "@/shared/types";

interface Props {
  universityId: string;
  clubId: string;
  enabled: boolean;
  canCreate: boolean;
  approvedMembers: ClubMemberRow[];
  /** Öğrenci kulüp sayfasında kart sarmalayıcı göster. */
  variant?: "tab" | "section";
}

export default function ClubGeneralMeetingsSection({
  universityId,
  clubId,
  enabled,
  canCreate,
  approvedMembers,
  variant = "tab",
}: Props) {
  const timezone = useTenantTimezone();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const listQuery = useQuery({
    queryKey: ["clubs", clubId, "general-meetings"],
    queryFn: () => listGeneralMeetings(clubId),
    enabled,
  });

  const detailQuery = useQuery({
    queryKey: ["clubs", clubId, "general-meetings", selectedId],
    queryFn: () => getGeneralMeeting(clubId, selectedId!),
    enabled: enabled && !!selectedId,
  });

  const meetings = listQuery.data ?? [];

  const body = (
    <>
      {canCreate && (
        <button type="button" className="btn-primary text-sm" onClick={() => setCreateOpen(true)}>
          <Icon name="add" size={14} /> Yeni genel kurul kaydı
        </button>
      )}

      {listQuery.isLoading ? (
        <div className="space-y-3">
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-16 w-full" />
        </div>
      ) : listQuery.isError ? (
        <div className="alert-error">
          {getErrorMessage(listQuery.error, "Genel kurul kayıtları yüklenemedi.")}
        </div>
      ) : meetings.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="Henüz genel kurul kaydı yok"
          description={
            canCreate
              ? "İlk toplantıyı kaydederek yönetim ve denetim kurulu seçimlerini, tutanağı ve yoklamayı sisteme işleyebilirsiniz."
              : "Kulüp yetkilileri genel kurul toplantılarını burada kayıt altına alır."
          }
          action={
            canCreate ? (
              <button type="button" className="btn-primary text-sm" onClick={() => setCreateOpen(true)}>
                <Icon name="add" size={14} /> İlk toplantıyı kaydet
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Tarih</th>
                <th className="px-4 py-3">Tür</th>
                <th className="px-4 py-3">Yer</th>
                <th className="px-4 py-3">Dönem</th>
                <th className="px-4 py-3">Katılımcı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {meetings.map((m) => (
                <tr
                  key={m.id}
                  className={`cursor-pointer transition-colors hover:bg-brand-50/50 ${
                    selectedId === m.id ? "bg-brand-50" : ""
                  }`}
                  onClick={() => setSelectedId(m.id)}
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {formatActivityDateTime(m.heldAt, timezone)}
                  </td>
                  <td className="px-4 py-3">{GENERAL_MEETING_TYPE_LABELS[m.meetingType]}</td>
                  <td className="px-4 py-3 text-slate-600">{m.location}</td>
                  <td className="px-4 py-3 text-slate-600">{m.academicTerm?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {selectedId === m.id && detailQuery.data
                      ? detailQuery.data.attendeeCount
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedId && detailQuery.isLoading && <div className="skeleton h-40 w-full" />}

      {selectedId && detailQuery.isError && (
        <div className="alert-error">
          {getErrorMessage(detailQuery.error, "Toplantı detayı yüklenemedi.")}
        </div>
      )}

      {selectedId && detailQuery.data && (
        <GeneralMeetingDetailPanel universityId={universityId} meeting={detailQuery.data} />
      )}

      <CreateGeneralMeetingModal
        open={createOpen}
        universityId={universityId}
        clubId={clubId}
        approvedMembers={approvedMembers}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => setSelectedId(id)}
      />
    </>
  );

  if (variant === "section") {
    return (
      <section className="card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="icon-tile">
            <Icon name="calendar" size={20} className="text-brand-600" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Genel kurul</h2>
            <p className="text-xs text-slate-500">Toplantı tutanakları ve kurul seçimleri</p>
          </div>
        </div>
        {body}
      </section>
    );
  }

  return <div className="space-y-4">{body}</div>;
}
