import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createContactLink, deleteContactLink, updateContactLink } from "@/features/clubs/api/clubs";
import { getErrorMessage } from "@/shared/api/client";
import Modal from "@/shared/ui/Modal";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import IconButton from "@/shared/ui/IconButton";
import { CONTACT_PLATFORM_LABELS } from "@/features/clubs/labels";
import type { ContactLink, ContactPlatform } from "@/shared/types";

// İletişim linkleri (FRONTEND_CLUBS.md §8.2). Yönetim officer/başkan işidir.
// Kurallar: platform başına TEK link; güncellemede platform sabittir (yalnızca url) —
// platform değişikliği sil + yeniden ekle akışıyla yapılır.

const schema = z.object({
  platform: z.enum(["whatsapp", "instagram", "discord", "telegram", "twitter", "website", "email", "other"]),
  url: z.string().trim().url("Geçerli bir URL girin.").max(512),
});
type FormValues = z.infer<typeof schema>;

interface ClubContactLinksSectionProps {
  clubId: string;
  links: ContactLink[];
  /** officer/başkan → ekleme/düzenleme/silme görünür */
  canManage: boolean;
}

export default function ClubContactLinksSection({ clubId, links, canManage }: ClubContactLinksSectionProps) {
  const queryClient = useQueryClient();
  const [formTarget, setFormTarget] = useState<ContactLink | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactLink | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["clubs", clubId] });

  const deleteMutation = useMutation({
    mutationFn: (linkId: string) => deleteContactLink(clubId, linkId),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
  });

  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="icon-tile"><Icon name="link" size={24} className="text-brand-600" /></span>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">İletişim</h2>
            <p className="text-xs text-slate-500">Kulübe ulaşabileceğin kanallar</p>
          </div>
        </div>
        {canManage && (
          <button className="btn-secondary text-xs" onClick={() => setFormTarget("new")}>
            + Link
          </button>
        )}
      </div>

      {links.length === 0 ? (
        <EmptyState icon="link" title="Henüz iletişim kanalı yok" />
      ) : (
        <ul className="space-y-2">
          {links.map((link) => {
            const meta = CONTACT_PLATFORM_LABELS[link.platform];
            return (
              <li key={link.id} className="flex items-center justify-between gap-2">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="link-nav flex min-w-0 items-center gap-2 text-sm font-semibold"
                >
                  <Icon name={meta.icon} size={16} className="shrink-0 text-brand-600" />
                  <span className="truncate">{meta.label}</span>
                </a>
                {canManage && (
                  <div className="flex shrink-0 items-center gap-1">
                    <IconButton icon="edit" label="Linki düzenle" onClick={() => setFormTarget(link)} />
                    <IconButton icon="delete" label="Linki sil" tone="danger" onClick={() => setDeleteTarget(link)} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ContactLinkFormModal
        key={formTarget === "new" ? "new" : formTarget?.id}
        open={formTarget !== null}
        clubId={clubId}
        editing={formTarget === "new" ? null : formTarget}
        onSaved={invalidate}
        onClose={() => setFormTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`${deleteTarget ? CONTACT_PLATFORM_LABELS[deleteTarget.platform].label : ""} linki silinsin mi?`}
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

// ---- Ekle/Düzenle modal formu ----
interface ContactLinkFormModalProps {
  open: boolean;
  clubId: string;
  editing: ContactLink | null;
  onSaved: () => void;
  onClose: () => void;
}

function ContactLinkFormModal({ open, clubId, editing, onSaved, onClose }: ContactLinkFormModalProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { platform: editing?.platform ?? "instagram", url: editing?.url ?? "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      if (editing) {
        // Platform backend'de sabittir — yalnızca url gönderilir (§8.2)
        await updateContactLink(clubId, editing.id, values.url);
      } else {
        await createContactLink(clubId, { platform: values.platform as ContactPlatform, url: values.url });
      }
      onSaved();
      onClose();
    } catch (error) {
      setError("root", { message: getErrorMessage(error, "Link kaydedilemedi.") });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Linki Düzenle" : "Yeni İletişim Linki"}
      description={editing ? "Platform değiştirilemez; farklı platform için sil + yeniden ekle." : undefined}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={isSubmitting}>
            Vazgeç
          </button>
          <button type="submit" form="contact-link-form" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </>
      }
    >
      {errors.root && <div className="alert-error mb-4">{errors.root.message}</div>}
      <form id="contact-link-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="input-label">Platform</label>
          <select {...register("platform")} className="select-field" disabled={!!editing}>
            {Object.entries(CONTACT_PLATFORM_LABELS).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="input-label">URL</label>
          <input {...register("url")} className="input-field" placeholder="https://..." autoFocus={!!editing} />
          {errors.url && <p className="input-error">{errors.url.message}</p>}
        </div>
      </form>
    </Modal>
  );
}
