import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addGalleryImage, deleteGalleryImage, getGallery } from "@/features/clubs/api/clubs";
import { getErrorMessage } from "@/shared/api/client";
import Modal from "@/shared/ui/Modal";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import type { GalleryImage } from "@/shared/types";

// Galeri (FRONTEND_CLUBS.md §9.2). Okuma herkese açık; ekleme/silme "staff".
// Upload endpoint'i yok — imageUrl düz URL alır (S3/Cloudinary ayrı iş).

const schema = z.object({
  imageUrl: z.string().trim().url("Geçerli bir görsel URL'si girin.").max(512),
  caption: z.string().trim().max(256, "En fazla 256 karakter.").optional(),
});
type FormValues = z.infer<typeof schema>;

interface ClubGallerySectionProps {
  clubId: string;
  canManage: boolean;
}

export default function ClubGallerySection({ clubId, canManage }: ClubGallerySectionProps) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GalleryImage | null>(null);

  const galleryQuery = useQuery({
    queryKey: ["clubs", clubId, "gallery"],
    queryFn: () => getGallery(clubId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["clubs", clubId, "gallery"] });

  const deleteMutation = useMutation({
    mutationFn: (imageId: string) => deleteGalleryImage(clubId, imageId),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
  });

  const images = galleryQuery.data ?? [];

  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="icon-tile"><Icon name="gallery" size={24} className="text-brand-600" /></span>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Galeri</h2>
            <p className="text-xs text-slate-500">Kulüpten kareler</p>
          </div>
        </div>
        {canManage && (
          <button className="btn-secondary text-xs" onClick={() => setAdding(true)}>
            + Görsel
          </button>
        )}
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
        <EmptyState icon="gallery" title="Galeri boş" />
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
              {canManage && (
                <button
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-slate-600 opacity-0 shadow-sm transition-opacity hover:text-red-600 group-hover:opacity-100"
                  onClick={() => setDeleteTarget(img)}
                  aria-label="Görseli sil"
                >
                  <Icon name="delete" size={15} />
                </button>
              )}
            </figure>
          ))}
        </div>
      )}

      <GalleryFormModal open={adding} clubId={clubId} onSaved={invalidate} onClose={() => setAdding(false)} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Görsel silinsin mi?"
        confirmLabel="Sil"
        loading={deleteMutation.isPending}
        error={deleteMutation.isError ? getErrorMessage(deleteMutation.error, "Silinemedi.") : null}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onClose={() => {
          setDeleteTarget(null);
          deleteMutation.reset();
        }}
      />
    </section>
  );
}

// ---- Ekleme modal formu ----
interface GalleryFormModalProps {
  open: boolean;
  clubId: string;
  onSaved: () => void;
  onClose: () => void;
}

function GalleryFormModal({ open, clubId, onSaved, onClose }: GalleryFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { imageUrl: "", caption: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await addGalleryImage(clubId, { imageUrl: values.imageUrl, caption: values.caption || undefined });
      onSaved();
      reset();
      onClose();
    } catch (error) {
      setError("root", { message: getErrorMessage(error, "Görsel eklenemedi.") });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Galeriye Görsel Ekle"
      description="Görselin barındırıldığı URL'yi yapıştır — dosya yükleme desteklenmez."
      size="sm"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={isSubmitting}>
            Vazgeç
          </button>
          <button type="submit" form="gallery-form" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Ekleniyor..." : "Ekle"}
          </button>
        </>
      }
    >
      {errors.root && <div className="alert-error mb-4">{errors.root.message}</div>}
      <form id="gallery-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="input-label">Görsel URL</label>
          <input {...register("imageUrl")} className="input-field" placeholder="https://..." autoFocus />
          {errors.imageUrl && <p className="input-error">{errors.imageUrl.message}</p>}
        </div>
        <div>
          <label className="input-label">Açıklama (opsiyonel)</label>
          <input {...register("caption")} className="input-field" />
          {errors.caption && <p className="input-error">{errors.caption.message}</p>}
        </div>
      </form>
    </Modal>
  );
}
