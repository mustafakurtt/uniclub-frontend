import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGallery } from "@/features/clubs/api/clubs";
import { removeAdminGalleryImage } from "@/features/admin/api/moderation";
import { getErrorMessage } from "@/shared/api/client";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import type { GalleryImage } from "@/shared/types";

/**
 * Galeri moderasyonu (`gallery.moderate`) — liste PUBLIC uçtan okunur
 * (`GET /clubs/:clubId/gallery`), yalnızca KALDIRMA admin ucundandır.
 */
interface ModerationGallerySectionProps {
  universityId: string;
  clubId: string;
  canModerate: boolean;
}

export default function ModerationGallerySection({
  universityId,
  clubId,
  canModerate,
}: ModerationGallerySectionProps) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<GalleryImage | null>(null);

  const galleryQuery = useQuery({
    queryKey: ["clubs", clubId, "gallery"],
    queryFn: () => getGallery(clubId),
  });

  const deleteMutation = useMutation({
    mutationFn: (imageId: string) => removeAdminGalleryImage(universityId, clubId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clubs", clubId, "gallery"] });
      setDeleteTarget(null);
    },
  });

  const images = galleryQuery.data ?? [];

  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="icon-tile"><Icon name="gallery" size={24} className="text-brand-600" /></span>
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Galeri</h2>
          <p className="text-xs text-slate-500">Uygunsuz görselleri kaldır</p>
        </div>
      </div>

      {galleryQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton aspect-square rounded-2xl" />
          ))}
        </div>
      ) : galleryQuery.isError ? (
        <div className="alert-error">{getErrorMessage(galleryQuery.error, "Galeri yüklenemedi.")}</div>
      ) : images.length === 0 ? (
        <EmptyState icon="gallery" title="Bu kulüpte görsel yok" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img) => (
            <figure key={img.id} className="group relative overflow-hidden rounded-2xl">
              <img
                src={img.imageUrl}
                alt={img.caption ?? ""}
                className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              {img.caption && (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 to-transparent px-3 pb-2 pt-8 text-xs font-semibold text-white">
                  {img.caption}
                </figcaption>
              )}
              {canModerate && (
                <button
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-slate-600 opacity-0 shadow-sm transition-opacity hover:text-red-600 group-hover:opacity-100"
                  onClick={() => setDeleteTarget(img)}
                  aria-label="Görseli kaldır"
                >
                  <Icon name="delete" size={15} />
                </button>
              )}
            </figure>
          ))}
        </div>
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
    </section>
  );
}
