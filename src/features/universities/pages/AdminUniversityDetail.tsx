import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUniversity, updateUniversity, deleteUniversity } from "@/features/universities/api/universities";
import { getErrorMessage } from "@/shared/api/client";
import RequirePermission from "@/features/auth/guards/RequirePermission";
import PageLoader from "@/shared/ui/PageLoader";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import { Icon } from "@/shared/ui/Icon";
import NameFormModal, { type NameFormValues } from "@/features/universities/components/NameFormModal";
import DomainsSection from "@/features/universities/components/DomainsSection";
import FacultiesSection from "@/features/universities/components/FacultiesSection";
import PosterQrManageSection from "@/features/poster-qr/components/PosterQrManageSection";

// Tek üniversite yönetim ekranı (docs/FRONTEND_UNIVERSITY.md §8.2 ağaç görünümü):
// başlık (ad/slug + düzenle/sil) + Domainler + Fakülteler/Bölümler.
export default function AdminUniversityDetail() {
  const { universityId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const universityQuery = useQuery({
    queryKey: ["university", universityId],
    queryFn: () => getUniversity(universityId),
    enabled: !!universityId,
  });

  const editMutation = useMutation({
    mutationFn: (values: NameFormValues) =>
      updateUniversity(universityId, { name: values.name, slug: values.slug || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["university", universityId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "accessibleUniversities"] });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteUniversity(universityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "accessibleUniversities"] });
      navigate("/admin/universities");
    },
  });

  if (universityQuery.isLoading) {
    return <PageLoader label="Üniversite yükleniyor..." />;
  }

  if (universityQuery.isError || !universityQuery.data) {
    return (
      <div className="space-y-4">
        <div className="alert-error">
          {getErrorMessage(universityQuery.error, "Üniversite bulunamadı.")}
        </div>
        <Link to="/admin/universities" className="btn-secondary">
          <Icon name="arrowLeft" size={16} /> Üniversitelere Dön
        </Link>
      </div>
    );
  }

  const university = universityQuery.data;

  return (
    <div className="space-y-6">
      <Link to="/admin/universities" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-brand-700">
        <Icon name="arrowLeft" size={16} /> Üniversiteler
      </Link>

      {/* Başlık */}
      <div className="card-gradient flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="icon-tile"><Icon name="university" size={24} className="text-brand-600" /></span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-extrabold text-slate-900">{university.name}</h1>
            <p className="truncate text-sm text-slate-400">/{university.slug}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <RequirePermission permission="university.update">
            <button className="btn-secondary text-xs" onClick={() => setEditing(true)}>
              <Icon name="edit" size={14} /> Düzenle
            </button>
          </RequirePermission>
          <RequirePermission permission="university.delete">
            <button
              className="btn-ghost text-xs text-slate-400 hover:text-red-600"
              onClick={() => setDeleting(true)}
            >
              <Icon name="delete" size={14} /> Sil
            </button>
          </RequirePermission>
        </div>
      </div>

      {/* İçerik: domainler + fakülteler/bölümler */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <DomainsSection universityId={universityId} domains={university.domains} />
        <FacultiesSection universityId={universityId} />
      </div>

      <RequirePermission permission="poster_qr.university.manage">
        <PosterQrManageSection
          scope="university"
          universityId={universityId}
          universityName={university.name}
        />
      </RequirePermission>

      {/* Düzenle */}
      <NameFormModal
        open={editing}
        title="Üniversiteyi Düzenle"
        nameLabel="Üniversite Adı"
        withSlug
        defaultValues={{ name: university.name, slug: university.slug }}
        error={editMutation.isError ? getErrorMessage(editMutation.error, "Güncellenemedi.") : null}
        onSubmit={(values) => editMutation.mutateAsync(values)}
        onClose={() => setEditing(false)}
      />

      {/* Sil */}
      <ConfirmDialog
        open={deleting}
        title={`"${university.name}" silinsin mi?`}
        description="Domainleri otomatik temizlenir. Bağlı fakülte, kullanıcı veya kulüp varsa işlem reddedilir."
        confirmLabel="Sil"
        loading={deleteMutation.isPending}
        error={deleteMutation.isError ? getErrorMessage(deleteMutation.error, "Silinemedi.") : null}
        onConfirm={() => deleteMutation.mutate()}
        onClose={() => {
          setDeleting(false);
          deleteMutation.reset();
        }}
      />
    </div>
  );
}
