import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "@/shared/ui/Modal";
import { Icon } from "@/shared/ui/Icon";
import { createUniversity } from "@/features/universities/api/universities";
import { getErrorMessage } from "@/shared/api/client";

// Üniversite oluşturma (docs/FRONTEND_UNIVERSITY.md §4.3) — isim + slug + en az
// bir e-posta domaini. Domainler dinamik satırlar (useFieldArray).
const schema = z.object({
  name: z.string().trim().min(2, "En az 2 karakter olmalıdır.").max(256),
  slug: z.string().trim().min(2, "En az 2 karakter olmalıdır.").max(256),
  domains: z
    .array(
      z.object({
        domain: z.string().trim().min(3, "Geçerli bir domain girin.").max(256),
        domainType: z.enum(["student", "staff"]),
      })
    )
    .min(1, "En az bir domain eklemelisiniz."),
});

type FormValues = z.infer<typeof schema>;

interface CreateUniversityModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateUniversityModal({ open, onClose }: CreateUniversityModalProps) {
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "", domains: [{ domain: "", domainType: "student" }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "domains" });

  useEffect(() => {
    if (open) reset({ name: "", slug: "", domains: [{ domain: "", domainType: "student" }] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const mutation = useMutation({
    mutationFn: createUniversity,
    onSuccess: () => {
      // Panel listesi artık GET /admin/universities'ten geliyor (AdminScope).
      queryClient.invalidateQueries({ queryKey: ["admin", "accessibleUniversities"] });
      onClose();
    },
    onError: (error) => {
      setError("root", { message: getErrorMessage(error, "Üniversite oluşturulamadı.") });
    },
  });

  const onSubmit = (values: FormValues) => mutation.mutateAsync(values);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Yeni Üniversite"
      description="Üniversiteyi ve kayıt akışında kullanılacak en az bir e-posta domainini tanımlayın."
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={isSubmitting}>
            Vazgeç
          </button>
          <button type="submit" form="create-university-form" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Oluşturuluyor..." : "Oluştur"}
          </button>
        </>
      }
    >
      {errors.root && <div className="alert-error mb-4">{errors.root.message}</div>}

      <form id="create-university-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="input-label">Üniversite Adı</label>
            <input {...register("name")} className="input-field" autoFocus placeholder="Örnek Üniversitesi" />
            {errors.name && <p className="input-error">{errors.name.message}</p>}
          </div>
          <div>
            <label className="input-label">Slug</label>
            <input {...register("slug")} className="input-field" placeholder="ornek-uni" />
            {errors.slug && <p className="input-error">{errors.slug.message}</p>}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="input-label mb-0">E-posta Domainleri</label>
            <button
              type="button"
              className="btn-ghost px-3 py-1 text-xs"
              onClick={() => append({ domain: "", domainType: "student" })}
            >
              + Domain Ekle
            </button>
          </div>

          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <div className="flex-1">
                  <input
                    {...register(`domains.${index}.domain`)}
                    className="input-field"
                    placeholder="std.ornek.edu.tr"
                  />
                  {errors.domains?.[index]?.domain && (
                    <p className="input-error">{errors.domains[index]?.domain?.message}</p>
                  )}
                </div>
                <select {...register(`domains.${index}.domainType`)} className="select-field w-32 shrink-0">
                  <option value="student">Öğrenci</option>
                  <option value="staff">Personel</option>
                </select>
                <button
                  type="button"
                  className="btn-ghost px-2.5 py-2.5 text-slate-400 hover:text-red-600 disabled:opacity-40"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  aria-label="Domaini kaldır"
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
            ))}
          </div>
          {errors.domains?.root && <p className="input-error">{errors.domains.root.message}</p>}
          {typeof errors.domains?.message === "string" && (
            <p className="input-error">{errors.domains.message}</p>
          )}
        </div>
      </form>
    </Modal>
  );
}
