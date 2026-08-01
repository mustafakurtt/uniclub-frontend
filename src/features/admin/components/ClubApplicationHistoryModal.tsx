import { useQuery } from "@tanstack/react-query";
import Modal from "@/shared/ui/Modal";
import { Icon } from "@/shared/ui/Icon";
import { getClubApplicationHistory } from "@/features/admin/api";
import {
  APPLICATION_EVENT_CHIP,
  APPLICATION_EVENT_LABELS,
} from "@/features/clubs/applicationLabels";
import { getErrorMessage } from "@/shared/api/client";
import type { ClubApplicationEvent } from "@/shared/types";

const EVENT_ICON: Record<ClubApplicationEvent["eventType"], "edit" | "check" | "reject" | "arrowRight"> = {
  revision_requested: "edit",
  resubmitted: "arrowRight",
  approved: "check",
  rejected: "reject",
};

interface ClubApplicationHistoryModalProps {
  open: boolean;
  universityId: string;
  applicationId: string;
  clubName: string;
  onClose: () => void;
}

function EventBody({ event }: { event: ClubApplicationEvent }) {
  if (event.eventType === "resubmitted") {
    return (
      <div className="mt-2 space-y-1 text-xs text-slate-600">
        {event.proposedName && (
          <p>
            <span className="font-semibold text-slate-500">Yeni ad:</span> {event.proposedName}
          </p>
        )}
        {event.description && (
          <p className="whitespace-pre-wrap">
            <span className="font-semibold text-slate-500">Açıklama:</span> {event.description}
          </p>
        )}
      </div>
    );
  }

  if (event.note) {
    return (
      <blockquote className="mt-2 rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs italic text-slate-600">
        {event.note}
      </blockquote>
    );
  }

  return null;
}

export default function ClubApplicationHistoryModal({
  open,
  universityId,
  applicationId,
  clubName,
  onClose,
}: ClubApplicationHistoryModalProps) {
  const historyQuery = useQuery({
    queryKey: ["admin", universityId, "club-application-history", applicationId],
    queryFn: () => getClubApplicationHistory(universityId, applicationId),
    enabled: open,
  });

  const history = historyQuery.data;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Başvuru geçmişi — ${clubName}`}
      description="Kim, hangi kademede, ne zaman karar verdi — kronolojik denetim izi."
      size="lg"
      footer={
        <button type="button" className="btn-primary" onClick={onClose}>
          Kapat
        </button>
      }
    >
      {historyQuery.isLoading ? (
        <div className="space-y-3">
          <div className="skeleton h-16 w-full" />
          <div className="skeleton h-16 w-full" />
        </div>
      ) : historyQuery.isError ? (
        <div className="alert-error">{getErrorMessage(historyQuery.error, "Geçmiş yüklenemedi.")}</div>
      ) : history ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="chip text-xs">
              Toplam revizyon talebi: <strong>{history.revisionRequestCount}</strong>
            </span>
            <span className="chip text-xs">
              Olay sayısı: <strong>{history.events.length}</strong>
            </span>
          </div>

          <ol className="relative space-y-4 border-l-2 border-slate-100 pl-5">
            {history.events.map((event) => (
              <li key={event.id} className="relative">
                <span className="absolute -left-[1.6rem] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-2 ring-slate-100">
                  <Icon name={EVENT_ICON[event.eventType]} size={13} className="text-slate-500" />
                </span>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`chip text-[10px] ${APPLICATION_EVENT_CHIP[event.eventType]}`}>
                      {APPLICATION_EVENT_LABELS[event.eventType]}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">Kademe {event.step}</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(event.createdAt).toLocaleString("tr-TR")}
                    </span>
                  </div>
                  {event.actor && (
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {event.actor.firstName} {event.actor.lastName}
                    </p>
                  )}
                  <EventBody event={event} />
                </div>
              </li>
            ))}
          </ol>

          {history.events.length === 0 && (
            <p className="text-center text-sm text-slate-500">Henüz kayıtlı olay yok.</p>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
