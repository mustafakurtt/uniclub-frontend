import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminClubGallery } from "@/features/admin/api/clubs";
import { removeAdminGalleryImage } from "@/features/admin/api/moderation";
import { getErrorMessage } from "@/shared/api/client";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import EmptyState from "@/shared/ui/EmptyState";
import IconButton from "@/shared/ui/IconButton";
import type { GalleryImage } from "@/shared/types";

const PAGE_SIZE = 20;

interface Props {
  universityId: string;
  clubId: string;
  canModerate: boolean;
  enabled: boolean;
}

export default function GalleryTab({ universityId, clubId, canModerate, enabled }: Props) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<GalleryImage | null>(null);

  const galleryQuery = useInfiniteQuery({
    queryKey: ["admin", universityId, "clubs", clubId, "gallery"],
    queryFn: ({ pageParam }) =>
      getAdminClubGallery(universityId, clubId, { limit: PAGE_SIZE, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });

  const deleteMutation = useMutation({
    mutationFn: (imageId: string) => removeAdminGalleryImage(universityId, clubId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", universityId, "clubs", clubId, "gallery"] });
      setDeleteTarget(null);
    },
  });

  const images = galleryQuery.data?.pages.flatMap((p) => p.items) ?? [];

  if (galleryQuery.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="skeleton aspect-square w-full" />
        <div className="skeleton aspect-square w-full" />
      </div>
    );
  }

  if (galleryQuery.isError) {
    return (
      <div className="alert-error">{getErrorMessage(galleryQuery.error, "Galeri yüklenemedi.")}</div>
    );
  }

  if (images.length === 0) {
    return <EmptyState icon="gallery" title="Bu kulüpte galeri görseli yok" />;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((img) => (
          <figure key={img.id} className="group relative overflow-hidden rounded-xl border border-slate-100">
            <img src={img.imageUrl} alt={img.caption ?? ""} className="aspect-square w-full object-cover" />
            {img.caption && (
              <figcaption className="truncate px-2 py-1 text-[11px] text-slate-500">{img.caption}</figcaption>
            )}
            {canModerate && (
              <IconButton
                icon="delete"
                label="Görseli kaldır"
                tone="danger"
                className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => setDeleteTarget(img)}
              />
            )}
          </figure>
        ))}
      </div>
      {galleryQuery.hasNextPage && (
        <button
          type="button"
          className="btn-ghost mt-4 text-sm"
          disabled={galleryQuery.isFetchingNextPage}
          onClick={() => galleryQuery.fetchNextPage()}
        >
          {galleryQuery.isFetchingNextPage ? "Yükleniyor…" : "Daha fazla göster"}
        </button>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Görsel kaldırılsın mı?"
        description="Bu bir moderasyon işlemidir; görsel geri getirilemez."
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
