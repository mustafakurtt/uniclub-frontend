import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitClubApplicationAppeal } from "@/features/clubs/api/clubs";
import { getErrorMessage } from "@/shared/api/client";
import { Icon } from "@/shared/ui/Icon";
import type { ClubApplicationAppealStatus, ClubApplicationDetail } from "@/shared/types";

const appealSchema = z.object({
  note: z
    .string()
    .trim()
    .min(10, "Gerekçe en az 10 karakter olmalıdır.")
    .max(2000, "En fazla 2000 karakter."),
});

type AppealFormValues = z.infer<typeof appealSchema>;

const APPEAL_STATUS_LABELS: Record<ClubApplicationAppealStatus, string> = {
  pending: "İnceleme bekliyor",
  upheld: "Kabul edildi — başvuru yeniden değerlendiriliyor",
  dismissed: "Reddedildi — itiraz kapatıldı",
};

function formatDeadline(deadline: string): string {
  return new Date(deadline).toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function daysRemaining(deadline: string): number {
  const ms = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

interface Props {
  applicationId: string;
  application: ClubApplicationDetail;
}

export default function ClubApplicationAppealSection({ applicationId, application }: Props) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AppealFormValues>({
    resolver: zodResolver(appealSchema),
    defaultValues: { note: "" },
  });

  const appealMutation = useMutation({
    mutationFn: (note: string) => submitClubApplicationAppeal(applicationId, { note }),
    onSuccess: async () => {
      reset({ note: "" });
      await queryClient.invalidateQueries({ queryKey: ["club-application", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["club-application-history", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
    },
  });

  if (application.status !== "rejected" && !application.appeal) return null;

  const appeal = application.appeal;

  return (
    <section className="card border-red-100 bg-red-50/30 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <span className="icon-tile shrink-0">
          <Icon name="reject" size={22} className="text-red-600" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold text-slate-900">Ret gerekçesi</h2>
          {application.rejectionReason ? (
            <blockquote className="mt-2 rounded-xl border border-red-100 bg-white px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap">
              {application.rejectionReason}
            </blockquote>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Ret gerekçesi kayıtlı değil.</p>
          )}
        </div>
      </div>

      {appeal ? (
        <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-2">
          <h3 className="text-sm font-bold text-slate-900">İtirazın</h3>
          <p className="text-xs text-slate-500">
            Durum: <strong>{APPEAL_STATUS_LABELS[appeal.status]}</strong>
            {appeal.submittedAt && (
              <>
                {" "}
                · Gönderim: {new Date(appeal.submittedAt).toLocaleString("tr-TR")}
              </>
            )}
          </p>
          <blockquote className="text-sm text-slate-600 whitespace-pre-wrap">{appeal.reason}</blockquote>
          {appeal.reviewedAt && (
            <p className="text-xs text-slate-500">
              İnceleme: {new Date(appeal.reviewedAt).toLocaleString("tr-TR")}
              {appeal.reviewedBy
                ? ` · ${appeal.reviewedBy.firstName} ${appeal.reviewedBy.lastName}`
                : ""}
            </p>
          )}
          {appeal.reviewNote && (
            <blockquote className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600 whitespace-pre-wrap">
              <span className="font-semibold text-slate-500">İnceleme notu: </span>
              {appeal.reviewNote}
            </blockquote>
          )}
        </div>
      ) : application.canAppeal ? (
        <form onSubmit={handleSubmit((values) => appealMutation.mutate(values.note))} className="space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">İtiraz et</h3>
            <p className="mt-1 text-xs text-slate-500">
              İtiraz hakkın <strong>bir kez</strong> kullanılabilir.
              {application.appealDeadline && (
                <>
                  {" "}
                  Son tarih: {formatDeadline(application.appealDeadline)}
                  {daysRemaining(application.appealDeadline) > 0 && (
                    <> ({daysRemaining(application.appealDeadline)} gün kaldı)</>
                  )}
                </>
              )}
            </p>
          </div>
          <div>
            <label htmlFor="appeal-note" className="input-label">
              İtiraz gerekçesi
            </label>
            <textarea
              id="appeal-note"
              rows={5}
              className="input-field min-h-[7rem] resize-y"
              placeholder="Neden yeniden değerlendirilmesi gerektiğini açıkla…"
              {...register("note")}
            />
            {errors.note && <p className="input-error">{errors.note.message}</p>}
          </div>
          {appealMutation.isError && (
            <div className="alert-error text-sm">
              {getErrorMessage(appealMutation.error, "İtiraz gönderilemedi.")}
            </div>
          )}
          <button type="submit" className="btn-primary text-sm" disabled={appealMutation.isPending}>
            {appealMutation.isPending ? "Gönderiliyor…" : "İtirazı Gönder"}
          </button>
        </form>
      ) : (
        <p className="text-sm text-slate-500">
          {application.appealDeadline && new Date() > new Date(application.appealDeadline)
            ? "İtiraz süresi doldu — bu başvuruya artık itiraz edilemez."
            : "Bu başvuruya itiraz edilemez."}
        </p>
      )}
    </section>
  );
}
