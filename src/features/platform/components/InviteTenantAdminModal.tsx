import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inviteTenantAdmin } from "@/features/platform/api/tenants";
import {
  inviteTenantAdminFormSchema,
  type InviteTenantAdminFormValues,
} from "@/features/platform/schemas/platformForms";
import { getErrorMessage } from "@/shared/api/client";
import Modal from "@/shared/ui/Modal";

interface Props {
  open: boolean;
  universityId: string;
  onSaved: () => void;
  onClose: () => void;
}

export default function InviteTenantAdminModal({ open, universityId, onSaved, onClose }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InviteTenantAdminFormValues>({
    resolver: zodResolver(inviteTenantAdminFormSchema),
    defaultValues: { firstName: "", lastName: "", email: "" },
  });

  const onSubmit = async (values: InviteTenantAdminFormValues) => {
    try {
      await inviteTenantAdmin(universityId, values);
      reset();
      onSaved();
      onClose();
    } catch (error) {
      setError("root", { message: getErrorMessage(error, "Davet gönderilemedi.") });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Yönetici davet et"
      description="Şifre belirlenmez — davetli e-postadaki linkten kendi şifresini oluşturur. E-posta tenant'ın personel (staff) domainlerinden biriyle eşleşmelidir."
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={isSubmitting}>
            Vazgeç
          </button>
          <button
            type="submit"
            form="invite-admin-form"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Gönderiliyor…" : "Davet gönder"}
          </button>
        </>
      }
    >
      {errors.root && <div className="alert-error mb-4">{errors.root.message}</div>}
      <form id="invite-admin-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="input-label">Ad</label>
            <input {...register("firstName")} className="input-field" autoFocus />
            {errors.firstName && <p className="input-error">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="input-label">Soyad</label>
            <input {...register("lastName")} className="input-field" />
            {errors.lastName && <p className="input-error">{errors.lastName.message}</p>}
          </div>
        </div>
        <div>
          <label className="input-label">E-posta</label>
          <input {...register("email")} className="input-field" type="email" />
          {errors.email && <p className="input-error">{errors.email.message}</p>}
        </div>
      </form>
    </Modal>
  );
}
