import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onboardPlatformTenant } from "@/features/platform/api/tenants";
import {
  onboardTenantFormSchema,
  type OnboardTenantFormValues,
} from "@/features/platform/schemas/platformForms";
import { DOMAIN_TYPE_LABELS } from "@/features/platform/labels";
import { getErrorMessage } from "@/shared/api/client";
import Modal from "@/shared/ui/Modal";
import SelectField from "@/shared/ui/SelectField";
import { Icon } from "@/shared/ui/Icon";

interface Props {
  open: boolean;
  onSaved: () => void;
  onClose: () => void;
}

export default function TenantOnboardModal({ open, onSaved, onClose }: Props) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OnboardTenantFormValues>({
    resolver: zodResolver(onboardTenantFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      status: "trial",
      domains: [{ domain: "", domainType: "student" }],
      includeInitialAdmin: true,
      initialAdmin: { firstName: "", lastName: "", email: "" },
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "domains" });
  const includeInitialAdmin = watch("includeInitialAdmin");

  const onSubmit = async (values: OnboardTenantFormValues) => {
    try {
      await onboardPlatformTenant({
        name: values.name,
        slug: values.slug,
        status: values.status,
        domains: values.domains,
        faculties: [],
        ...(values.includeInitialAdmin && values.initialAdmin
          ? { initialAdmin: values.initialAdmin }
          : {}),
      });
      reset();
      onSaved();
      onClose();
    } catch (error) {
      setError("root", { message: getErrorMessage(error, "Tenant açılamadı.") });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Yeni tenant aç"
      description="Üniversite, e-posta alan adları ve isteğe bağlı ilk yönetici daveti."
      size="lg"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={isSubmitting}>
            Vazgeç
          </button>
          <button
            type="submit"
            form="tenant-onboard-form"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Açılıyor…" : "Tenant'ı aç"}
          </button>
        </>
      }
    >
      {errors.root && <div className="alert-error mb-4">{errors.root.message}</div>}
      <form id="tenant-onboard-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="input-label">Üniversite adı</label>
            <input {...register("name")} className="input-field" />
            {errors.name && <p className="input-error">{errors.name.message}</p>}
          </div>
          <div>
            <label className="input-label">Slug</label>
            <input {...register("slug")} className="input-field" placeholder="ornek-bilim" />
            {errors.slug && <p className="input-error">{errors.slug.message}</p>}
          </div>
        </div>

        <div>
          <label className="input-label">Başlangıç durumu</label>
          <SelectField {...register("status")} className="select-field">
            <option value="trial">Deneme (trial)</option>
            <option value="active">Aktif</option>
          </SelectField>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="input-label mb-0">
              E-posta alan adları <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              className="btn-ghost text-xs"
              onClick={() => append({ domain: "", domainType: "student" })}
            >
              <Icon name="add" size={13} /> Domain ekle
            </button>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            Kayıt sırasında kullanıcının e-posta adresinin @ sonrası kısmı bu listede aranır.
            <strong> Öğrenci</strong> domaini öğrenci kaydı için;{" "}
            <strong>personel</strong> domaini yönetici ve personel içindir — ilk yönetici daveti
            personel domaini gerektirir.
          </p>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-wrap items-start gap-2">
                <input
                  {...register(`domains.${index}.domain`)}
                  className="input-field min-w-[12rem] flex-1"
                  placeholder="std.ornek.edu.tr"
                />
                <SelectField
                  {...register(`domains.${index}.domainType`)}
                  className="select-field w-auto min-w-[10rem]"
                >
                  <option value="student">{DOMAIN_TYPE_LABELS.student}</option>
                  <option value="staff">{DOMAIN_TYPE_LABELS.staff}</option>
                </SelectField>
                {fields.length > 1 && (
                  <button
                    type="button"
                    className="btn-ghost text-xs text-red-600"
                    onClick={() => remove(index)}
                  >
                    Kaldır
                  </button>
                )}
              </div>
            ))}
          </div>
          {errors.domains && (
            <p className="input-error mt-1">
              {typeof errors.domains.message === "string"
                ? errors.domains.message
                : errors.domains.root?.message}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <input type="checkbox" {...register("includeInitialAdmin")} />
            İlk yönetici daveti gönder (önerilir)
          </label>
          <p className="mt-1 text-xs text-slate-500">
            Adminsiz tenant kimse tarafından yönetilemez. Davet e-postası commit sonrası gider;
            şifre yönetici tarafından belirlenir.
          </p>
          {includeInitialAdmin && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="input-label">Ad</label>
                <input {...register("initialAdmin.firstName")} className="input-field" />
              </div>
              <div>
                <label className="input-label">Soyad</label>
                <input {...register("initialAdmin.lastName")} className="input-field" />
              </div>
              <div className="sm:col-span-2">
                <label className="input-label">E-posta (personel domaini)</label>
                <input {...register("initialAdmin.email")} className="input-field" type="email" />
                {errors.initialAdmin?.email && (
                  <p className="input-error">{errors.initialAdmin.email.message}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
