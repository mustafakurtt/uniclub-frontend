import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminClubAnnouncements } from "@/features/admin/api/clubs";
import { removeAdminAnnouncement } from "@/features/admin/api/moderation";
import { getErrorMessage } from "@/shared/api/client";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import EmptyState from "@/shared/ui/EmptyState";
import IconButton from "@/shared/ui/IconButton";
import type { Announcement } from "@/shared/types";

const PAGE_SIZE = 20;

interface Props {
  universityId: string;
  clubId: string;
  canModerate: boolean;
  enabled: boolean;
}

export default function AnnouncementsTab({
  universityId,
  clubId,
  canModerate,
  enabled,
}: Props) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const announcementsQuery = useInfiniteQuery({
    queryKey: ["admin", universityId, "clubs", clubId, "announcements"],
    queryFn: ({ pageParam }) =>
      getAdminClubAnnouncements(universityId, clubId, { limit: PAGE_SIZE, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });

  const deleteMutation = useMutation({
    mutationFn: (announcementId: string) =>
      removeAdminAnnouncement(universityId, clubId, announcementId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", universityId, "clubs", clubId, "announcements"],
      });
      setDeleteTarget(null);
    },
  });

  const announcements = announcementsQuery.data?.pages.flatMap((p) => p.items) ?? [];

  if (announcementsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-16 w-full" />
        <div className="skeleton h-16 w-full" />
      </div>
    );
  }

  if (announcementsQuery.isError) {
    return (
      <div className="alert-error">
        {getErrorMessage(announcementsQuery.error, "Duyurular yüklenemedi.")}
      </div>
    );
  }

  if (announcements.length === 0) {
    return <EmptyState icon="announcement" title="Bu kulüpte duyuru yok" />;
  }

  return (
    <>
      <ul className="space-y-4">
        {announcements.map((a) => (
          <li key={a.id} className="rounded-2xl border border-slate-100 bg-white/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display font-bold text-slate-900">{a.title}</h3>
                <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-slate-600">
                  {a.content}
                </p>
                <p className="mt-2 text-[11px] font-semibold text-slate-400">
                  {a.status === "draft" ? "Taslak · " : ""}
                  {new Date(a.createdAt).toLocaleString("tr-TR")}
                </p>
              </div>
              {canModerate && (
                <IconButton
                  icon="delete"
                  label="Duyuruyu kaldır"
                  tone="danger"
                  className="shrink-0"
                  onClick={() => setDeleteTarget(a)}
                />
              )}
            </div>
          </li>
        ))}
      </ul>
      {announcementsQuery.hasNextPage && (
        <button
          type="button"
          className="btn-ghost mt-4 text-sm"
          disabled={announcementsQuery.isFetchingNextPage}
          onClick={() => announcementsQuery.fetchNextPage()}
        >
          {announcementsQuery.isFetchingNextPage ? "Yükleniyor…" : "Daha fazla göster"}
        </button>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={`"${deleteTarget?.title}" kaldırılsın mı?`}
        description="Bu bir moderasyon işlemidir; duyuru geri getirilemez."
        confirmLabel="Kaldır"
        loading={deleteMutation.isPending}
        error={deleteMutation.isError ? getErrorMessage(deleteMutation.error, "Kaldırılamadı.") : null}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onClose={() => {
          setDeleteTarget(null);
          deleteMutation.reset();
        }}
      />
    </>
  );
}
