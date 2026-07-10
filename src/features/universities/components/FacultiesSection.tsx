import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import EmptyState from "@/shared/ui/EmptyState";
import PageLoader from "@/shared/ui/PageLoader";
import { Icon } from "@/shared/ui/Icon";
import IconButton from "@/shared/ui/IconButton";
import RequirePermission from "@/features/auth/guards/RequirePermission";
import NameFormModal, { type NameFormValues } from "@/features/universities/components/NameFormModal";
import {
  getFaculties,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "@/features/universities/api/universities";
import { getErrorMessage } from "@/shared/api/client";
import type { Department, Faculty } from "@/shared/types";

// Fakülteler + Bölümler bölümü (docs/FRONTEND_UNIVERSITY.md §6–§7). Bölümler her
// zaman fakülte üzerinden çekilir; fakülte satırı açıldığında lazy yüklenir.
interface FacultiesSectionProps {
  universityId: string;
}

export default function FacultiesSection({ universityId }: FacultiesSectionProps) {
  const queryClient = useQueryClient();
  const [formTarget, setFormTarget] = useState<Faculty | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Faculty | null>(null);

  const facultiesQuery = useQuery({
    queryKey: ["university", universityId, "faculties"],
    queryFn: () => getFaculties(universityId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["university", universityId, "faculties"] });

  const saveMutation = useMutation({
    mutationFn: (values: NameFormValues) =>
      formTarget === "new"
        ? createFaculty(universityId, { name: values.name })
        : updateFaculty(universityId, (formTarget as Faculty).id, { name: values.name }),
    onSuccess: () => {
      invalidate();
      setFormTarget(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteFaculty(universityId, deleteTarget!.id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
  });

  const faculties = facultiesQuery.data ?? [];

  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="icon-tile"><Icon name="faculty" size={24} className="text-brand-600" /></span>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Fakülteler & Bölümler</h2>
            <p className="text-xs text-slate-500">Bir fakülteyi açarak bölümlerini yönetin.</p>
          </div>
        </div>
        <RequirePermission permission="university.faculty.create">
          <button className="btn-secondary text-xs" onClick={() => setFormTarget("new")}>
            + Fakülte
          </button>
        </RequirePermission>
      </div>

      {facultiesQuery.isLoading ? (
        <PageLoader label="Fakülteler yükleniyor..." />
      ) : facultiesQuery.isError ? (
        <div className="alert-error">{getErrorMessage(facultiesQuery.error, "Fakülteler yüklenemedi.")}</div>
      ) : faculties.length === 0 ? (
        <EmptyState icon="faculty" title="Fakülte yok" description="İlk fakülteyi ekleyerek başlayın." />
      ) : (
        <div className="space-y-3">
          {faculties.map((faculty) => (
            <FacultyRow
              key={faculty.id}
              universityId={universityId}
              faculty={faculty}
              onEdit={() => setFormTarget(faculty)}
              onDelete={() => setDeleteTarget(faculty)}
            />
          ))}
        </div>
      )}

      <NameFormModal
        key={formTarget === "new" ? "new-faculty" : (formTarget as Faculty | null)?.id}
        open={formTarget !== null}
        title={formTarget === "new" ? "Yeni Fakülte" : "Fakülteyi Düzenle"}
        nameLabel="Fakülte Adı"
        defaultValues={{ name: formTarget === "new" ? "" : (formTarget as Faculty | null)?.name ?? "" }}
        error={saveMutation.isError ? getErrorMessage(saveMutation.error, "Kaydedilemedi.") : null}
        onSubmit={(values) => saveMutation.mutateAsync(values)}
        onClose={() => setFormTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`"${deleteTarget?.name}" silinsin mi?`}
        description="Bölümü olan fakülte silinemez; önce bölümleri kaldırın."
        confirmLabel="Sil"
        loading={deleteMutation.isPending}
        error={deleteMutation.isError ? getErrorMessage(deleteMutation.error, "Silinemedi.") : null}
        onConfirm={() => deleteMutation.mutate()}
        onClose={() => {
          setDeleteTarget(null);
          deleteMutation.reset();
        }}
      />
    </section>
  );
}

// ---- Tek fakülte satırı (açılınca bölümleri lazy yükler) ----
interface FacultyRowProps {
  universityId: string;
  faculty: Faculty;
  onEdit: () => void;
  onDelete: () => void;
}

function FacultyRow({ universityId, faculty, onEdit, onDelete }: FacultyRowProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formTarget, setFormTarget] = useState<Department | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  const departmentsQuery = useQuery({
    queryKey: ["departments", universityId, faculty.id],
    queryFn: () => getDepartments(universityId, faculty.id),
    enabled: open,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["departments", universityId, faculty.id] });

  const saveMutation = useMutation({
    mutationFn: (values: NameFormValues) =>
      formTarget === "new"
        ? createDepartment(universityId, faculty.id, { name: values.name })
        : updateDepartment(universityId, faculty.id, (formTarget as Department).id, { name: values.name }),
    onSuccess: () => {
      invalidate();
      setFormTarget(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteDepartment(universityId, faculty.id, deleteTarget!.id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
  });

  const departments = departmentsQuery.data ?? [];

  return (
    <div className="rounded-2xl border border-slate-100 bg-white/70">
      <div className="flex items-center gap-2 p-3">
        <button
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <Icon
            name="chevronRight"
            size={16}
            className={`text-slate-400 transition-transform ${open ? "rotate-90" : ""}`}
          />
          <span className="truncate text-sm font-semibold text-slate-800">{faculty.name}</span>
        </button>
        <RequirePermission permission="university.faculty.update">
          <IconButton icon="edit" label="Fakülteyi düzenle" onClick={onEdit} />
        </RequirePermission>
        <RequirePermission permission="university.faculty.delete">
          <IconButton icon="delete" label="Fakülteyi sil" tone="danger" onClick={onDelete} />
        </RequirePermission>
      </div>

      {open && (
        <div className="border-t border-slate-100 p-3 pl-9">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Bölümler</p>
            <RequirePermission permission="university.department.create">
              <button className="btn-ghost px-3 py-1 text-xs" onClick={() => setFormTarget("new")}>
                + Bölüm
              </button>
            </RequirePermission>
          </div>

          {departmentsQuery.isLoading ? (
            <p className="py-3 text-sm text-slate-400">Bölümler yükleniyor...</p>
          ) : departmentsQuery.isError ? (
            <div className="alert-error">
              {getErrorMessage(departmentsQuery.error, "Bölümler yüklenemedi.")}
            </div>
          ) : departments.length === 0 ? (
            <p className="py-3 text-sm text-slate-400">Bu fakültede henüz bölüm yok.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {departments.map((dept) => (
                <li key={dept.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="truncate text-sm text-slate-700">{dept.name}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    <RequirePermission permission="university.department.update">
                      <IconButton icon="edit" label="Düzenle" onClick={() => setFormTarget(dept)} />
                    </RequirePermission>
                    <RequirePermission permission="university.department.delete">
                      <IconButton icon="delete" label="Sil" tone="danger" onClick={() => setDeleteTarget(dept)} />
                    </RequirePermission>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <NameFormModal
        key={formTarget === "new" ? `new-dept-${faculty.id}` : (formTarget as Department | null)?.id}
        open={formTarget !== null}
        title={formTarget === "new" ? "Yeni Bölüm" : "Bölümü Düzenle"}
        nameLabel="Bölüm Adı"
        defaultValues={{ name: formTarget === "new" ? "" : (formTarget as Department | null)?.name ?? "" }}
        error={saveMutation.isError ? getErrorMessage(saveMutation.error, "Kaydedilemedi.") : null}
        onSubmit={(values) => saveMutation.mutateAsync(values)}
        onClose={() => setFormTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`"${deleteTarget?.name}" silinsin mi?`}
        description="Bu bölüme atanmış kullanıcı varsa silinemez."
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
