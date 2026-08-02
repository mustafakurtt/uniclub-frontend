import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPlatformUser } from "@/features/platform/api/operatorUsers";
import {
  createPlatformUserFormSchema,
  type CreatePlatformUserFormValues,
} from "@/features/platform/schemas/platformForms";
import { PLATFORM_ROLE_LABELS } from "@/features/platform/labels";
import { getErrorMessage } from "@/shared/api/client";
import Modal from "@/shared/ui/Modal";
import SelectField from "@/shared/ui/SelectField";

interface Props {
  open: boolean;
  onSaved: () => void;
  onClose: () => void;
}

export default function PlatformUserFormModal({ open, onSaved, onClose }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreatePlatformUserFormValues>({
    resolver: zodResolver(createPlatformUserFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "platform_support",
    },
  });

  const onSubmit = async (values: CreatePlatformUserFormValues) => {
    try {
      await createPlatformUser(values);
      reset();
      onSaved();
      onClose();
    } catch (error) {
      setError("root", { message: getErrorMessage(error, "Hesap oluşturulamadı.") });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Platform operatörü"
      description="Tenant'sız hesap — yalnızca SaaS operasyon paneline erişir."
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={isSubmitting}>
            Vazgeç
          </button>
          <button
            type="submit"
            form="platform-user-form"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Oluşturuluyor…" : "Hesap oluştur"}
          </button>
        </>
      }
    >
      {errors.root && <div className="alert-error mb-4">{errors.root.message}</div>}
      <form id="platform-user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        <div>
          <label className="input-label">Geçici şifre (min. 12 karakter)</label>
          <input {...register("password")} className="input-field" type="password" />
          {errors.password && <p className="input-error">{errors.password.message}</p>}
          <p className="mt-1 text-xs text-slate-500">İlk girişte şifre değiştirmesi zorunludur.</p>
        </div>
        <div>
          <label className="input-label">Rol</label>
          <SelectField {...register("role")} className="select-field">
            <option value="platform_support">{PLATFORM_ROLE_LABELS.platform_support}</option>
            <option value="super_admin">{PLATFORM_ROLE_LABELS.super_admin}</option>
          </SelectField>
        </div>
      </form>
    </Modal>
  );
}
