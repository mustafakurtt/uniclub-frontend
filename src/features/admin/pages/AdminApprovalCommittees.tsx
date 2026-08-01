import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import RequireUniversity from "@/features/admin/components/RequireUniversity";
import ApprovalCommitteeFormModal, {
  type ApprovalCommitteeFormValues,
} from "@/features/admin/components/ApprovalCommitteeFormModal";
import {
  createApprovalCommittee,
  listApprovalCommittees,
  updateApprovalCommittee,
} from "@/features/admin/api";
import { committeeMajorityRequiredPreview } from "@/features/admin/committeeLabels";
import RequirePermission from "@/features/auth/guards/RequirePermission";
import Forbidden from "@/features/auth/pages/Forbidden";
import { getErrorMessage } from "@/shared/api/client";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import PageLoader from "@/shared/ui/PageLoader";
import type { ApprovalCommittee } from "@/shared/types";

function ApprovalCommitteesBody({ universityId }: { universityId: string }) {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ApprovalCommittee | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const committeesQuery = useQuery({
    queryKey: ["admin", universityId, "approval-committees"],
    queryFn: () => listApprovalCommittees(universityId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", universityId, "approval-committees"] });

  const createMutation = useMutation({
    mutationFn: (body: ApprovalCommitteeFormValues) =>
      createApprovalCommittee(universityId, {
        name: body.name,
        memberUserIds: body.memberUserIds,
        isActive: body.isActive,
      }),
    onSuccess: async () => {
      await invalidate();
      setFormOpen(false);
      setFormError(null);
    },
    onError: (err) => setFormError(getErrorMessage(err, "Kurul oluşturulamadı.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      committeeId,
      body,
    }: {
      committeeId: string;
      body: ApprovalCommitteeFormValues;
    }) =>
      updateApprovalCommittee(universityId, committeeId, {
        name: body.name,
        memberUserIds: body.memberUserIds,
        isActive: body.isActive,
      }),
    onSuccess: async () => {
      await invalidate();
      setEditing(null);
      setFormError(null);
    },
    onError: (err) => setFormError(getErrorMessage(err, "Kurul güncellenemedi.")),
  });

  const openCreate = () => {
    setFormError(null);
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (committee: ApprovalCommittee) => {
    setFormError(null);
    setEditing(committee);
    setFormOpen(true);
  };

  const handleSubmit = async (values: ApprovalCommitteeFormValues) => {
    if (editing) {
      await updateMutation.mutateAsync({ committeeId: editing.id, body: values });
    } else {
      await createMutation.mutateAsync(values);
    }
  };

  if (committeesQuery.isLoading) {
    return <PageLoader label="Onay kurulları yükleniyor…" />;
  }

  if (committeesQuery.isError) {
    return (
      <div className="alert-error">
        {getErrorMessage(committeesQuery.error, "Onay kurulları yüklenemedi.")}
      </div>
    );
  }

  const committees = committeesQuery.data ?? [];

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Onay Kurulları</h1>
        <p className="mt-1 text-sm text-slate-500">
          Başvuru onay zincirinde salt çoğunlukla karar veren kurullar.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{committees.length} kurul tanımlı</p>
        <button type="button" className="btn-primary text-sm" onClick={openCreate}>
          <Icon name="add" size={14} /> Kurul oluştur
        </button>
      </div>

      {committees.length === 0 ? (
        <EmptyState
          icon="members"
          title="Henüz onay kurulu yok"
          description="Kurul oluşturup üyeleri atayın; başvuru onay zincirinde salt çoğunlukla karar vermek için Politikalar'dan zincire ekleyin."
          action={
            <button type="button" className="btn-primary text-sm" onClick={openCreate}>
              Kurul oluştur
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {committees.map((c) => {
            const threshold = committeeMajorityRequiredPreview(c.members.length);
            return (
              <article key={c.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-base font-bold text-slate-900">{c.name}</h2>
                      <span
                        className={`chip text-[10px] ${
                          c.isActive
                            ? "bg-green-50 text-green-700 border-green-100"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {c.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {c.members.length} üye · en az {threshold} onay gerekir
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost text-sm"
                    onClick={() => openEdit(c)}
                  >
                    <Icon name="edit" size={14} /> Düzenle
                  </button>
                </div>
                <ul className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-100">
                  {c.members.map((m) => (
                    <li key={m.userId} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {(m.user.firstName[0] ?? "?").toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {m.user.firstName} {m.user.lastName}
                        </p>
                        <p className="truncate text-xs text-slate-400">{m.user.email}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      )}

      <ApprovalCommitteeFormModal
        open={formOpen || !!editing}
        universityId={universityId}
        committee={editing}
        loading={createMutation.isPending || updateMutation.isPending}
        error={formError}
        onSubmit={handleSubmit}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
          setFormError(null);
          createMutation.reset();
          updateMutation.reset();
        }}
      />
    </>
  );
}

export default function AdminApprovalCommittees() {
  return (
    <RequirePermission permission="university.settings.manage" fallback={<Forbidden />}>
      <RequireUniversity>
        {(universityId) => <ApprovalCommitteesBody universityId={universityId} />}
      </RequireUniversity>
    </RequirePermission>
  );
}
