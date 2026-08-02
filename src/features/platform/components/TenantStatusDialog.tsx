import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updatePlatformTenantStatus } from "@/features/platform/api/tenants";
import {
  tenantStatusFormSchema,
  type TenantStatusFormValues,
} from "@/features/platform/schemas/platformForms";
import { TENANT_STATUS_LABELS } from "@/features/platform/labels";
import { getErrorMessage } from "@/shared/api/client";
import Modal from "@/shared/ui/Modal";
import type { TenantListItem, UniversityLifecycleStatus } from "@/shared/types";

interface Props {
  open: boolean;
  tenant: TenantListItem;
  targetStatus: UniversityLifecycleStatus;
  onSaved: () => void;
  onClose: () => void;
}

export default function TenantStatusDialog({
  open,
  tenant,
  targetStatus,
  onSaved,
  onClose,
}: Props) {
  const isSuspend = targetStatus === "suspended";

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TenantStatusFormValues>({
    resolver: zodResolver(tenantStatusFormSchema),
    defaultValues: { reason: "" },
  });

  const onSubmit = async (values: TenantStatusFormValues) => {
    try {
      await updatePlatformTenantStatus(tenant.id, {
        status: targetStatus,
        reason: values.reason,
      });
      reset();
      onSaved();
      onClose();
    } catch (error) {
      setError("root", { message: getErrorMessage(error, "Durum güncellenemedi.") });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isSuspend ? "Tenant'ı askıya al" : `Durumu değiştir: ${TENANT_STATUS_LABELS[targetStatus]}`}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={isSubmitting}>
            Vazgeç
          </button>
          <button
            type="submit"
            form="tenant-status-form"
            className={isSuspend ? "btn-primary bg-red-600 hover:bg-red-700" : "btn-primary"}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Kaydediliyor…" : "Onayla"}
          </button>
        </>
      }
    >
      {isSuspend ? (
        <div className="mb-4 space-y-3">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <p className="font-bold">
              «{tenant.name}» askıya alınacak.
            </p>
            <p className="mt-2">
              Bu okuldaki <strong>tüm kullanıcılar</strong> sisteme giremez; oturum açma ve kayıt
              reddedilir. Bu işlem geri alınana kadar geçerlidir.
            </p>
          </div>
        </div>
      ) : (
        <p className="mb-4 text-sm text-slate-600">
          <strong>{tenant.name}</strong> durumu{" "}
          <strong>{TENANT_STATUS_LABELS[targetStatus]}</strong> olarak güncellenecek.
        </p>
      )}

      {errors.root && <div className="alert-error mb-4">{errors.root.message}</div>}

      <form id="tenant-status-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="input-label">Gerekçe (audit kaydına yazılır)</label>
          <textarea
            {...register("reason")}
            className="input-field min-h-[100px]"
            placeholder={
              isSuspend
                ? `${tenant.name} askıya alınma nedeni…`
                : "Durum değişikliği gerekçesi…"
            }
          />
          {errors.reason && <p className="input-error">{errors.reason.message}</p>}
        </div>
      </form>
    </Modal>
  );
}
