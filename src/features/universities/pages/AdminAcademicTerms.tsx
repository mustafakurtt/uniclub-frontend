import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import RequireUniversity from "@/features/admin/components/RequireUniversity";
import RequirePermission from "@/features/auth/guards/RequirePermission";
import Forbidden from "@/features/auth/pages/Forbidden";
import { useTenantTimezone } from "@/features/auth/hooks/useTenantTimezone";
import { formatActivityRange } from "@/features/activities/formatActivityDateTime";
import {
  createAcademicTerm,
  deleteAcademicTerm,
  listAcademicTerms,
  updateAcademicTerm,
} from "@/features/universities/api/academicTerms";
import AcademicTermFormModal from "@/features/universities/components/AcademicTermFormModal";
import { getErrorMessage } from "@/shared/api/client";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import PageLoader from "@/shared/ui/PageLoader";
import type { AcademicTerm } from "@/shared/types";

const TERM_STATUS_LABELS = {
  open: "Açık",
  closed: "Kapalı",
} as const;

function AcademicTermsBody({ universityId }: { universityId: string }) {
  const queryClient = useQueryClient();
  const timezone = useTenantTimezone();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicTerm | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AcademicTerm | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const termsQuery = useQuery({
    queryKey: ["admin", universityId, "academic-terms"],
    queryFn: () => listAcademicTerms(universityId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", universityId, "academic-terms"] });

  const createMutation = useMutation({
    mutationFn: (body: { name: string; startsAt: string; endsAt: string }) =>
      createAcademicTerm(universityId, body),
    onSuccess: async () => {
      await invalidate();
      setFormOpen(false);
      setFormError(null);
    },
    onError: (err) => setFormError(getErrorMessage(err, "Dönem oluşturulamadı.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      termId,
      body,
    }: {
      termId: string;
      body: { name: string; startsAt: string; endsAt: string };
    }) => updateAcademicTerm(universityId, termId, body),
    onSuccess: async () => {
      await invalidate();
      setEditing(null);
      setFormError(null);
    },
    onError: (err) => setFormError(getErrorMessage(err, "Dönem güncellenemedi.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (termId: string) => deleteAcademicTerm(universityId, termId),
    onSuccess: async () => {
      await invalidate();
      setDeleting(null);
      setDeleteError(null);
    },
    onError: (err) => setDeleteError(getErrorMessage(err, "Dönem silinemedi.")),
  });

  const openCreate = () => {
    setFormError(null);
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (term: AcademicTerm) => {
    setFormError(null);
    setEditing(term);
    setFormOpen(true);
  };

  const handleFormSubmit = async (values: { name: string; startsAt: string; endsAt: string }) => {
    if (editing) {
      await updateMutation.mutateAsync({ termId: editing.id, body: values });
    } else {
      await createMutation.mutateAsync(values);
    }
  };

  if (termsQuery.isLoading) {
    return <PageLoader label="Akademik dönemler yükleniyor…" />;
  }

  if (termsQuery.isError) {
    return (
      <div className="alert-error">
        {getErrorMessage(termsQuery.error, "Akademik dönemler yüklenemedi.")}
      </div>
    );
  }

  const terms = termsQuery.data ?? [];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {terms.length} dönem tanımlı
          {terms.some((t) => t.isActive) ? " · aktif dönem vurgulanır" : ""}
        </p>
        <button type="button" className="btn-primary text-sm" onClick={openCreate}>
          <Icon name="add" size={16} /> Yeni dönem
        </button>
      </div>

      {terms.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="Henüz akademik dönem yok"
          description="Devir teslim ve dönemsel raporlar için en az bir dönem tanımlayın."
        />
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {terms.map((term) => (
            <li
              key={term.id}
              className={`flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between ${
                term.isActive ? "rounded-2xl border-2 border-brand-400 bg-brand-50/60 px-4 -mx-1" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-bold text-slate-900">{term.name}</h3>
                  {term.isActive && (
                    <span className="chip border-brand-300 bg-brand-100 text-brand-800">Aktif dönem</span>
                  )}
                  <span
                    className={`chip ${
                      term.status === "open"
                        ? "border-green-100 bg-green-50 text-green-700"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    {TERM_STATUS_LABELS[term.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {formatActivityRange(term.startsAt, term.endsAt, timezone)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" className="btn-ghost text-sm" onClick={() => openEdit(term)}>
                  <Icon name="edit" size={14} /> Düzenle
                </button>
                <button
                  type="button"
                  className="btn-ghost text-sm text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setDeleteError(null);
                    setDeleting(term);
                  }}
                >
                  <Icon name="delete" size={14} /> Sil
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AcademicTermFormModal
        open={formOpen}
        term={editing}
        error={formError}
        onSubmit={handleFormSubmit}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
          setFormError(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Akademik dönemi sil"
        description={
          deleting ? (
            <>
              <strong>{deleting.name}</strong> kalıcı olarak silinecek. Bağlı üyelik kayıtları varsa
              işlem reddedilir.
            </>
          ) : undefined
        }
        confirmLabel="Sil"
        loading={deleteMutation.isPending}
        error={deleteError}
        onConfirm={() => {
          if (deleting) deleteMutation.mutate(deleting.id);
        }}
        onClose={() => {
          if (!deleteMutation.isPending) {
            setDeleting(null);
            setDeleteError(null);
          }
        }}
      />
    </>
  );
}

export default function AdminAcademicTerms() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Akademik Dönemler</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
          Kurumunuzun güz, bahar veya yaz dönemlerini tanımlayın. Aktif dönem, açık durumdaki ve
          bugünün tarihine denk gelen aralıktır.
        </p>
      </div>

      <section className="card p-5">
        <RequirePermission permission="university.academic_term.manage" fallback={<Forbidden />}>
          <RequireUniversity>{(universityId) => <AcademicTermsBody universityId={universityId} />}</RequireUniversity>
        </RequirePermission>
      </section>
    </div>
  );
}
