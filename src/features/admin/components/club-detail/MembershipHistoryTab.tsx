import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatActivityDateTime } from "@/features/activities/formatActivityDateTime";
import { getMembershipHistory } from "@/features/clubs/api/membershipHistory";
import {
  CLUB_ROLE_LABELS,
  MEMBERSHIP_HISTORY_EVENT_LABELS,
} from "@/features/clubs/labels";
import { listAcademicTerms } from "@/features/universities/api/academicTerms";
import { useTenantTimezone } from "@/features/auth/hooks/useTenantTimezone";
import { getErrorMessage } from "@/shared/api/client";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import type { MembershipHistoryEvent } from "@/shared/types";

const PAGE_SIZE = 30;

function userName(user: MembershipHistoryEvent["user"]): string {
  if (!user) return "Bilinmeyen kullanıcı";
  return `${user.firstName} ${user.lastName}`;
}

function actorLabel(actor: MembershipHistoryEvent["actor"]): string | null {
  if (!actor) return null;
  return `${actor.firstName} ${actor.lastName}`;
}

function EventDetail({ event }: { event: MembershipHistoryEvent }) {
  if (event.eventType === "role_changed" && event.previousRole && event.role) {
    return (
      <span className="text-sm text-slate-600">
        {CLUB_ROLE_LABELS[event.previousRole]} → {CLUB_ROLE_LABELS[event.role]}
      </span>
    );
  }
  if (event.role) {
    return <span className="text-sm text-slate-600">{CLUB_ROLE_LABELS[event.role]}</span>;
  }
  return null;
}

function HistoryRow({ event, timezone }: { event: MembershipHistoryEvent; timezone: string | null }) {
  const actor = actorLabel(event.actor);

  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      <div className="relative flex flex-col items-center">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-200 bg-brand-50 text-brand-700">
          <Icon name="pending" size={16} />
        </span>
        <span className="absolute top-9 h-full w-px bg-slate-100" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-slate-900">
            {MEMBERSHIP_HISTORY_EVENT_LABELS[event.eventType]}
          </span>
          <span className="chip text-[11px]">
            {event.academicTerm?.name ?? "Dönem dışı"}
          </span>
        </div>
        <p className="mt-1 text-sm font-semibold text-slate-800">{userName(event.user)}</p>
        <EventDetail event={event} />
        <p className="mt-1 text-xs text-slate-500">
          {formatActivityDateTime(event.occurredAt, timezone)}
          {actor && event.eventType !== "left" ? ` · İşlemi yapan: ${actor}` : ""}
        </p>
      </div>
    </li>
  );
}

interface Props {
  universityId: string;
  clubId: string;
  enabled: boolean;
}

export default function MembershipHistoryTab({ universityId, clubId, enabled }: Props) {
  const timezone = useTenantTimezone();
  const [termFilter, setTermFilter] = useState("");

  const termsQuery = useQuery({
    queryKey: ["admin", universityId, "academic-terms"],
    queryFn: () => listAcademicTerms(universityId),
    enabled,
  });

  const historyQuery = useInfiniteQuery({
    queryKey: ["club", clubId, "membership-history", { academicTermId: termFilter || undefined }],
    queryFn: ({ pageParam }) =>
      getMembershipHistory(clubId, {
        limit: PAGE_SIZE,
        cursor: pageParam,
        academicTermId: termFilter || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });

  const events = historyQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const terms = termsQuery.data ?? [];

  if (historyQuery.isLoading) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-10 w-full max-w-xs" />
        <div className="skeleton h-16 w-full" />
        <div className="skeleton h-16 w-full" />
      </div>
    );
  }

  if (historyQuery.isError) {
    return (
      <div className="alert-error">
        {getErrorMessage(historyQuery.error, "Üyelik tarihçesi yüklenemedi.")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1 sm:max-w-xs">
          <label className="input-label" htmlFor="history-term-filter">
            Akademik dönem
          </label>
          <select
            id="history-term-filter"
            className="input-field"
            value={termFilter}
            onChange={(e) => setTermFilter(e.target.value)}
            disabled={termsQuery.isLoading}
          >
            <option value="">Tüm dönemler</option>
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
                {term.isActive ? " (aktif)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon="members"
          title="Henüz üyelik olayı yok"
          description={
            termFilter
              ? "Seçili dönemde katılım, rol değişikliği veya ayrılma kaydı bulunmuyor. Farklı bir dönem deneyin."
              : "Üye kabulü, rol değişikliği veya ayrılmalar burada kronolojik olarak listelenir."
          }
        />
      ) : (
        <ol className="mt-2">
          {events.map((event) => (
            <HistoryRow key={event.id} event={event} timezone={timezone} />
          ))}
        </ol>
      )}

      {historyQuery.hasNextPage && (
        <button
          type="button"
          className="btn-ghost text-sm"
          disabled={historyQuery.isFetchingNextPage}
          onClick={() => historyQuery.fetchNextPage()}
        >
          {historyQuery.isFetchingNextPage ? "Yükleniyor…" : "Daha fazla göster"}
        </button>
      )}
    </div>
  );
}
