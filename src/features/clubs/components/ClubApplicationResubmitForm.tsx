import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getErrorMessage } from "@/shared/api/client";

const schema = z.object({
  proposedName: z
    .string()
    .trim()
    .min(3, "En az 3 karakter olmalıdır.")
    .max(256, "En fazla 256 karakter."),
  description: z.string().trim().max(2000, "En fazla 2000 karakter.").optional(),
});

export type ResubmitFormValues = z.infer<typeof schema>;

interface ClubApplicationResubmitFormProps {
  defaultValues: ResubmitFormValues;
  revisionNote: string;
  revisionStep: number;
  loading: boolean;
  error: unknown;
  onSubmit: (values: ResubmitFormValues) => void;
}

export default function ClubApplicationResubmitForm({
  defaultValues,
  revisionNote,
  revisionStep,
  loading,
  error,
  onSubmit,
}: ClubApplicationResubmitFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResubmitFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card border-violet-100 bg-violet-50/40 p-6 space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold text-slate-900">Başvuruyu düzenle ve yeniden gönder</h2>
        <p className="mt-1 text-sm text-slate-600">
          Kademe {revisionStep} revizyon talep etti. Aşağıdaki notu dikkate alarak başvurunu güncelle;
          onaylanmış önceki kademeler korunur.
        </p>
      </div>

      <blockquote className="rounded-2xl border border-violet-100 bg-white px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap">
        {revisionNote}
      </blockquote>

      <div>
        <label className="input-label" htmlFor="proposedName">
          Önerilen kulüp adı
        </label>
        <input id="proposedName" className="input-field" {...register("proposedName")} />
        {errors.proposedName && <p className="input-error">{errors.proposedName.message}</p>}
      </div>

      <div>
        <label className="input-label" htmlFor="description">
          Açıklama
        </label>
        <textarea
          id="description"
          rows={6}
          className="input-field min-h-[8rem] resize-y"
          placeholder="Kulübün amacı, faaliyet alanları, hedef kitlesi…"
          {...register("description")}
        />
        {errors.description && <p className="input-error">{errors.description.message}</p>}
      </div>

      {error ? (
        <div className="alert-error text-sm">{getErrorMessage(error, "Yeniden gönderilemedi.")}</div>
      ) : null}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Gönderiliyor…" : "Düzeltmeleri Gönder"}
      </button>
    </form>
  );
}
