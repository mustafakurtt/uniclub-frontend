import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClubApplication } from "@/features/clubs/api/clubs";
import { getErrorMessage } from "@/shared/api/client";
import { Icon } from "@/shared/ui/Icon";

const schema = z.object({
  proposedName: z
    .string()
    .trim()
    .min(3, "En az 3 karakter olmalıdır.")
    .max(256, "En fazla 256 karakter."),
  description: z.string().trim().max(2000, "En fazla 2000 karakter.").optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateClubApplicationPage() {
  const [success, setSuccess] = useState<
    | { kind: "application"; id: string; name: string }
    | { kind: "formation_proposal"; id: string; name: string; threshold: number }
    | null
  >(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { proposedName: "", description: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await createClubApplication({
        proposedName: values.proposedName,
        description: values.description || undefined,
      });

      if (result.kind === "formation_proposal") {
        setSuccess({
          kind: "formation_proposal",
          id: result.id,
          name: result.proposedName,
          threshold: result.supportThreshold,
        });
        return;
      }

      setSuccess({
        kind: "application",
        id: result.id,
        name: result.proposedName,
      });
    } catch (error) {
      setError("root", {
        message: getErrorMessage(error, "Başvuru gönderilemedi."),
      });
    }
  };

  if (success?.kind === "formation_proposal") {
    return (
      <div className="mx-auto max-w-lg space-y-6 text-center">
        <Icon name="party" size={48} className="mx-auto text-brand-500" />
        <h1 className="font-display text-2xl font-extrabold text-slate-900">
          Önerin destek topluyor!
        </h1>
        <p className="text-sm text-slate-600">
          <strong>{success.name}</strong> kuruluş önerin oluşturuldu. SKS incelemesine
          düşmesi için <strong>{success.threshold} dijital destek</strong> gerekiyor —
          kampüsteki öğrencilerden destek iste.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link to={`/clubs/proposals/${success.id}`} className="btn-primary">
            Önerime git
          </Link>
          <Link to="/clubs/proposals" className="btn-secondary">
            Tüm öneriler
          </Link>
        </div>
      </div>
    );
  }

  if (success?.kind === "application") {
    return (
      <div className="mx-auto max-w-lg space-y-6 text-center">
        <Icon name="check" size={48} className="mx-auto text-green-600" />
        <h1 className="font-display text-2xl font-extrabold text-slate-900">
          Başvurun alındı
        </h1>
        <p className="text-sm text-slate-600">
          <strong>{success.name}</strong> kulüp kurma başvurun okul yönetimine iletildi.
          Karar verildiğinde bildirim alacaksın.
        </p>
        <Link to={`/applications/${success.id}`} className="btn-primary inline-flex">
          Başvuru durumunu gör
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link to="/clubs" className="btn-ghost mb-4 px-0 text-sm">
          <Icon name="arrowLeft" size={14} /> Kulüplere dön
        </Link>
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Kulüp Kur</h1>
        <p className="mt-1 text-sm text-slate-500">
          Yeni bir öğrenci kulübü için başvuru veya kuruluş önerisi oluştur.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6">
        {errors.root && <div className="alert-error text-sm">{errors.root.message}</div>}

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
            rows={5}
            className="input-field min-h-[7rem] resize-y"
            placeholder="Kulübün amacı, hedef kitlesi, planlanan faaliyetler…"
            {...register("description")}
          />
          {errors.description && <p className="input-error">{errors.description.message}</p>}
        </div>

        <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? "Gönderiliyor…" : "Başvuruyu Gönder"}
        </button>
      </form>
    </div>
  );
}
