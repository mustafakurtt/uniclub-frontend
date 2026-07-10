import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUniversity, deleteUniversity } from "@/features/universities/api/universities";
import { useAdminScope } from "@/features/admin/context/AdminScopeContext";
import { getErrorMessage } from "@/shared/api/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import RequirePermission from "@/features/auth/guards/RequirePermission";
import PageLoader from "@/shared/ui/PageLoader";
import EmptyState from "@/shared/ui/EmptyState";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import { Icon } from "@/shared/ui/Icon";
import IconButton from "@/shared/ui/IconButton";
import CreateUniversityModal from "@/features/universities/components/CreateUniversityModal";
import NameFormModal, { type NameFormValues } from "@/features/universities/components/NameFormModal";
import type { University } from "@/shared/types";

// Sistem yönetimi → Üniversiteler (docs/FRONTEND_UNIVERSITY.md §8.2).
//
// Liste artık AdminScope'tan (GET /api/admin/universities) gelir — public
// GET /api/universities bilinçli olarak GLOBAL'dir ve kayıt formu içindir;
// panelde kullanılırsa university_admin başka okulları da görür
// (FRONTEND_RUTBE_VE_PLATFORM.md §2). Oluştur/güncelle/sil butonları granüler
// yetkiye bağlı; arama artık istemci tarafında (liste zaten kapsamla sınırlı).
export default function AdminUniversities() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const scope = useAdminScope();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editTarget, setEditTarget] = useState<University | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<University | null>(null);

  // Kapsam listesi değişince (oluştur/sil/güncelle) seçici de tazelensin.
  const invalidateScope = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "accessibleUniversities"] });

  const editMutation = useMutation({
    mutationFn: (values: NameFormValues) =>
      updateUniversity(editTarget!.id, { name: values.name, slug: values.slug || undefined }),
    onSuccess: () => {
      invalidateScope();
      setEditTarget(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteUniversity(deleteTarget!.id),
    onSuccess: () => {
      invalidateScope();
      setDeleteTarget(null);
    },
  });

  const universities = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr-TR");
    if (!q) return scope.universities;
    return scope.universities.filter(
      (u) =>
        u.name.toLocaleLowerCase("tr-TR").includes(q) ||
        u.slug.toLocaleLowerCase("tr-TR").includes(q)
    );
  }, [scope.universities, search]);

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900">Üniversiteler</h1>
          <p className="mt-1 text-sm text-slate-500">
            Üniversiteleri, e-posta domainlerini ve akademik yapıyı yönetin.
          </p>
        </div>
        <RequirePermission permission="university.create">
          <button className="btn-primary shrink-0" onClick={() => setCreating(true)}>
            + Yeni Üniversite
          </button>
        </RequirePermission>
      </div>

      {/* Arama */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-field max-w-md"
        placeholder="Üniversite ara..."
      />

      {/* Liste */}
      {scope.isLoading ? (
        <PageLoader label="Üniversiteler yükleniyor..." />
      ) : scope.isError ? (
        <div className="alert-error">
          {getErrorMessage(scope.error, "Üniversiteler yüklenemedi.")}
        </div>
      ) : universities.length === 0 ? (
        <EmptyState
          icon="university"
          title={search ? "Sonuç bulunamadı" : "Henüz üniversite yok"}
          description={
            search
              ? "Farklı bir arama terimi deneyin."
              : "İlk üniversiteyi oluşturarak akademik yapıyı kurmaya başlayın."
          }
          action={
            !search && (
              <RequirePermission permission="university.create">
                <button className="btn-primary" onClick={() => setCreating(true)}>
                  + Yeni Üniversite
                </button>
              </RequirePermission>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {universities.map((uni) => (
            <div key={uni.id} className="card-hover flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-display text-lg font-bold text-slate-900">{uni.name}</h3>
                  <p className="truncate text-xs text-slate-400">/{uni.slug}</p>
                </div>
                <span className="icon-tile shrink-0"><Icon name="university" size={24} className="text-brand-600" /></span>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <Link to={`/admin/universities/${uni.id}`} className="btn-secondary flex-1 justify-center text-xs">
                  Yönet <Icon name="arrowRight" size={15} />
                </Link>
                <RequirePermission permission="university.update">
                  <IconButton icon="edit" label="Düzenle" onClick={() => setEditTarget(uni)} />
                </RequirePermission>
                <RequirePermission permission="university.delete">
                  <IconButton icon="delete" label="Sil" tone="danger" onClick={() => setDeleteTarget(uni)} />
                </RequirePermission>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Oluştur */}
      {hasPermission("university.create") && (
        <CreateUniversityModal open={creating} onClose={() => setCreating(false)} />
      )}

      {/* Düzenle */}
      <NameFormModal
        open={!!editTarget}
        title="Üniversiteyi Düzenle"
        nameLabel="Üniversite Adı"
        withSlug
        defaultValues={{ name: editTarget?.name ?? "", slug: editTarget?.slug ?? "" }}
        error={editMutation.isError ? getErrorMessage(editMutation.error, "Güncellenemedi.") : null}
        onSubmit={(values) => editMutation.mutateAsync(values)}
        onClose={() => setEditTarget(null)}
      />

      {/* Sil */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={`"${deleteTarget?.name}" silinsin mi?`}
        description="Domainleri otomatik temizlenir. Bağlı fakülte, kullanıcı veya kulüp varsa işlem reddedilir."
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
