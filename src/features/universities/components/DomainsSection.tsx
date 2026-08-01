import { useEffect, useState } from "react";
import SelectField from "@/shared/ui/SelectField";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "@/shared/ui/Modal";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import IconButton from "@/shared/ui/IconButton";
import RequirePermission from "@/features/auth/guards/RequirePermission";
import { createDomain, updateDomain, deleteDomain } from "@/features/universities/api/universities";
import { getErrorMessage } from "@/shared/api/client";
import type { UniversityDomain } from "@/shared/types";

// Üniversite domainleri bölümü (docs/FRONTEND_UNIVERSITY.md §5). Domainler kayıt
// akışında tenant + rol (student/staff) çözümü için kullanılır; son domain silinemez.

const schema = z.object({
  domain: z.string().trim().min(3, "Geçerli bir domain girin.").max(256),
  domainType: z.enum(["student", "staff"]),
});
type FormValues = z.infer<typeof schema>;

const typeLabel: Record<UniversityDomain["domainType"], string> = {
  student: "Öğrenci",
  staff: "Personel",
};

interface DomainsSectionProps {
  universityId: string;
  domains: UniversityDomain[];
}

export default function DomainsSection({ universityId, domains }: DomainsSectionProps) {
  const queryClient = useQueryClient();
  const [formTarget, setFormTarget] = useState<UniversityDomain | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UniversityDomain | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["university", universityId] });

  const deleteMutation = useMutation({
    mutationFn: () => deleteDomain(universityId, deleteTarget!.id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
  });

  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="icon-tile"><Icon name="email" size={24} className="text-brand-600" /></span>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">E-posta Domainleri</h2>
            <p className="text-xs text-slate-500">Kayıt akışında üniversiteyi ve rolü belirler.</p>
          </div>
        </div>
        <RequirePermission permission="university.domain.create">
          <button className="btn-secondary text-xs" onClick={() => setFormTarget("new")}>
            + Ekle
          </button>
        </RequirePermission>
      </div>

      {domains.length === 0 ? (
        <EmptyState icon="email" title="Domain yok" description="Kayıt olabilmek için en az bir domain gerekir." />
      ) : (
        <ul className="divide-y divide-slate-100">
          {domains.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-semibold text-slate-800">{d.domain}</p>
                <span className="chip mt-1">{typeLabel[d.domainType]}</span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <RequirePermission permission="university.domain.update">
                  <IconButton icon="edit" label="Düzenle" onClick={() => setFormTarget(d)} />
                </RequirePermission>
                <RequirePermission permission="university.domain.delete">
                  <IconButton icon="delete" label="Sil" tone="danger" onClick={() => setDeleteTarget(d)} />
                </RequirePermission>
              </div>
            </li>
          ))}
        </ul>
      )}

      <DomainFormModal
        key={formTarget === "new" ? "new" : formTarget?.id}
        open={formTarget !== null}
        universityId={universityId}
        editing={formTarget === "new" ? null : formTarget}
        onSaved={invalidate}
        onClose={() => setFormTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`"${deleteTarget?.domain}" silinsin mi?`}
        description="Üniversitenin son domaini silinemez; aksi halde bu üniversiteye kimse kayıt olamaz."
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

// ---- Ekle/Düzenle modal formu ----
interface DomainFormModalProps {
  open: boolean;
  universityId: string;
  editing: UniversityDomain | null;
  onSaved: () => void;
  onClose: () => void;
}

function DomainFormModal({ open, universityId, editing, onSaved, onClose }: DomainFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { domain: editing?.domain ?? "", domainType: editing?.domainType ?? "student" },
  });

  useEffect(() => {
    if (open) reset({ domain: editing?.domain ?? "", domainType: editing?.domainType ?? "student" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (editing) await updateDomain(universityId, editing.id, values);
      else await createDomain(universityId, values);
      onSaved();
      onClose();
    } catch (error) {
      setError("root", { message: getErrorMessage(error, "Domain kaydedilemedi.") });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Domaini Düzenle" : "Yeni Domain"}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={isSubmitting}>
            Vazgeç
          </button>
          <button type="submit" form="domain-form" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </>
      }
    >
      {errors.root && <div className="alert-error mb-4">{errors.root.message}</div>}
      <form id="domain-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="input-label">Domain</label>
          <input {...register("domain")} className="input-field" placeholder="std.ornek.edu.tr" autoFocus />
          {errors.domain && <p className="input-error">{errors.domain.message}</p>}
        </div>
        <div>
          <label className="input-label">Tür</label>
          <SelectField {...register("domainType")} className="select-field">
            <option value="student">Öğrenci</option>
            <option value="staff">Personel</option>
          </SelectField>
        </div>
      </form>
    </Modal>
  );
}
