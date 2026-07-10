import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
} from "@/features/admin/api/rbac";
import { getErrorMessage } from "@/shared/api/client";
import PageLoader from "@/shared/ui/PageLoader";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import Modal from "@/shared/ui/Modal";
import { Icon } from "@/shared/ui/Icon";
import IconButton from "@/shared/ui/IconButton";
import { permissionLabel, PERMISSION_GROUPS } from "@/features/admin/labels";
import type { Permission } from "@/shared/types";

// Yetki kataloğu (docs/FRONTEND_YONETIM.md §6.3) — `permission.manage`, yalnızca
// super_admin. `key` oluşturulduktan sonra değişmez (yalnızca açıklama güncellenir);
// seed çekirdek yetkileri silinemez (backend reddeder, mesaj gösterilir).

const permSchema = z.object({
  key: z
    .string()
    .trim()
    .min(3, "En az 3 karakter.")
    .max(64, "En fazla 64 karakter.")
    .regex(/^[a-z]+(\.[a-z]+)+$/, "Biçim: kaynak.aksiyon (örn. event.moderate)."),
  description: z
    .union([z.string().trim().max(256, "En fazla 256 karakter."), z.literal("")])
    .optional(),
});
type PermFormValues = z.infer<typeof permSchema>;

export default function AdminPermissions() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editTarget, setEditTarget] = useState<Permission | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Permission | null>(null);

  const permsQuery = useQuery({ queryKey: ["rbac", "permissions"], queryFn: getPermissions });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["rbac", "permissions"] });

  const createForm = useForm<PermFormValues>({
    resolver: zodResolver(permSchema),
    defaultValues: { key: "", description: "" },
  });
  const editForm = useForm<{ description: string }>({ defaultValues: { description: "" } });

  const createMutation = useMutation({
    mutationFn: (values: PermFormValues) =>
      createPermission({ key: values.key, description: values.description || undefined }),
    onSuccess: () => {
      invalidate();
      setCreating(false);
      createForm.reset();
    },
  });

  const editMutation = useMutation({
    mutationFn: (description: string) => updatePermission(editTarget!.id, { description }),
    onSuccess: () => {
      invalidate();
      setEditTarget(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePermission(deleteTarget!.id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
  });

  const permissions = permsQuery.data ?? [];
  // Bilinen grup öneklerine göre bölümle; hiçbirine uymayanlar "Diğer".
  const groups = [...PERMISSION_GROUPS, { title: "Diğer", match: () => true }];
  const grouped = groups
    .map((g, i) => ({
      title: g.title,
      items: permissions.filter(
        (p) => groups.findIndex((gg) => gg.match(p.key)) === i
      ),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900">Yetkiler</h1>
          <p className="mt-1 text-sm text-slate-500">
            Sistem yetki kataloğu. Anahtar oluşturulduktan sonra değişmez.
          </p>
        </div>
        <button className="btn-primary shrink-0" onClick={() => setCreating(true)}>
          <Icon name="add" size={16} /> Yeni Yetki
        </button>
      </div>

      {permsQuery.isLoading ? (
        <PageLoader label="Yetkiler yükleniyor..." />
      ) : permsQuery.isError ? (
        <div className="alert-error">{getErrorMessage(permsQuery.error, "Yetkiler yüklenemedi.")}</div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.title} className="card p-5">
              <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-slate-400">
                {group.title}
              </h2>
              <ul className="divide-y divide-slate-100">
                {group.items.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold text-slate-800">{p.key}</p>
                      <p className="truncate text-xs text-slate-500">
                        {p.description || permissionLabel(p.key)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <IconButton
                        icon="edit"
                        label="Açıklamayı düzenle"
                        onClick={() => {
                          setEditTarget(p);
                          editForm.reset({ description: p.description ?? "" });
                        }}
                      />
                      <IconButton
                        icon="delete"
                        label="Yetkiyi sil"
                        tone="danger"
                        onClick={() => setDeleteTarget(p)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* Oluştur */}
      <Modal
        open={creating}
        onClose={() => {
          setCreating(false);
          createMutation.reset();
        }}
        title="Yeni Yetki"
        size="sm"
        footer={
          <>
            <button type="button" className="btn-ghost" onClick={() => setCreating(false)}>
              Vazgeç
            </button>
            <button
              type="submit"
              form="perm-create-form"
              className="btn-primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
            </button>
          </>
        }
      >
        {createMutation.isError && (
          <div className="alert-error mb-4">
            {getErrorMessage(createMutation.error, "Yetki oluşturulamadı.")}
          </div>
        )}
        <form
          id="perm-create-form"
          onSubmit={createForm.handleSubmit((v) => createMutation.mutate(v))}
          className="space-y-4"
        >
          <div>
            <label className="input-label">Anahtar (kaynak.aksiyon)</label>
            <input
              {...createForm.register("key")}
              className="input-field font-mono"
              placeholder="event.moderate"
              autoFocus
            />
            {createForm.formState.errors.key && (
              <p className="input-error">{createForm.formState.errors.key.message}</p>
            )}
          </div>
          <div>
            <label className="input-label">Açıklama</label>
            <input {...createForm.register("description")} className="input-field" />
          </div>
        </form>
      </Modal>

      {/* Açıklama düzenle */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Yetkiyi Düzenle — ${editTarget?.key ?? ""}`}
        description="Anahtar değiştirilemez; yalnızca açıklama güncellenir."
        size="sm"
        footer={
          <>
            <button type="button" className="btn-ghost" onClick={() => setEditTarget(null)}>
              Vazgeç
            </button>
            <button
              type="submit"
              form="perm-edit-form"
              className="btn-primary"
              disabled={editMutation.isPending}
            >
              {editMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </>
        }
      >
        {editMutation.isError && (
          <div className="alert-error mb-4">
            {getErrorMessage(editMutation.error, "Güncellenemedi.")}
          </div>
        )}
        <form
          id="perm-edit-form"
          onSubmit={editForm.handleSubmit((v) => editMutation.mutate(v.description))}
        >
          <label className="input-label">Açıklama</label>
          <input {...editForm.register("description")} className="input-field" autoFocus />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`"${deleteTarget?.key}" yetkisi silinsin mi?`}
        description="Rollerden ve kişisel override'lardan kaldırılır. Çekirdek yetkiler silinemez."
        confirmLabel="Sil"
        loading={deleteMutation.isPending}
        error={deleteMutation.isError ? getErrorMessage(deleteMutation.error, "Silinemedi.") : null}
        onConfirm={() => deleteMutation.mutate()}
        onClose={() => {
          setDeleteTarget(null);
          deleteMutation.reset();
        }}
      />
    </div>
  );
}
