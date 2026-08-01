import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import { Icon } from "@/shared/ui/Icon";
import { reviewClubApplicationAppeal, type AdminClubApplicationDetail } from "@/features/admin/api";
import { getErrorMessage } from "@/shared/api/client";
import type { ClubApplicationAppealStatus, ClubApplicationEvent } from "@/shared/types";

const APPEAL_STATUS_LABELS: Record<ClubApplicationAppealStatus, string> = {
  pending: "İnceleme bekliyor",
  upheld: "Kabul edildi",
  dismissed: "Reddedildi",
};

const APPEAL_STATUS_CHIP: Record<ClubApplicationAppealStatus, string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-100",
  upheld: "bg-green-50 text-green-700 border-green-100",
  dismissed: "bg-slate-100 text-slate-600 border-slate-200",
};

const reviewSchema = z.object({
  note: z.string().trim().min(10, "Karar gerekçesi en az 10 karakter olmalıdır.").max(2000),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

function findAppealSubmittedEvent(events: ClubApplicationEvent[]) {
  return [...events].reverse().find((e) => e.eventType === "appeal_submitted");
}

interface Props {
  universityId: string;
  application: AdminClubApplicationDetail;
  historyEvents: ClubApplicationEvent[];
}

export default function ClubApplicationAppealReviewSection({
  universityId,
  application,
  historyEvents,
}: Props) {
  const queryClient = useQueryClient();
  const appeal = application.appeal;
  const [pendingDecision, setPendingDecision] = useState<"upheld" | "dismissed" | null>(null);

  const submittedEvent = findAppealSubmittedEvent(historyEvents);
  const studentNote = appeal?.reason ?? submittedEvent?.note ?? null;
  const submittedAt = appeal?.submittedAt ?? submittedEvent?.createdAt ?? null;

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { note: "" },
  });

  const reviewMutation = useMutation({
    mutationFn: (payload: { decision: "upheld" | "dismissed"; note: string }) =>
      reviewClubApplicationAppeal(universityId, application.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", universityId, "club-application", application.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", universityId, "club-application-history", application.id],
      });
      queryClient.invalidateQueries({ queryKey: ["admin", universityId, "club-applications"] });
      setPendingDecision(null);
    },
  });

  if (!appeal && !submittedEvent) return null;

  const status: ClubApplicationAppealStatus = appeal?.status ?? "pending";

  const submitReview = (decision: "upheld" | "dismissed") => {
    reviewMutation.mutate({ decision, note: getValues("note") });
  };

  return (
    <section className="card border-amber-100 bg-amber-50/40 p-5">
      <div className="flex items-start gap-3">
        <span className="icon-tile shrink-0">
          <Icon name="inbox" size={22} className="text-amber-700" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-base font-bold text-slate-900">Öğrenci itirazı</h2>
            <span className={`chip text-[11px] ${APPEAL_STATUS_CHIP[status]}`}>
              {APPEAL_STATUS_LABELS[status]}
            </span>
          </div>
          {submittedAt && (
            <p className="mt-1 text-xs text-slate-500">
              Gönderim: {new Date(submittedAt).toLocaleString("tr-TR")}
            </p>
          )}
          {studentNote && (
            <blockquote className="mt-3 rounded-xl border border-amber-100 bg-white px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap">
              {studentNote}
            </blockquote>
          )}
          {status === "upheld" && (
            <p className="mt-3 text-sm text-green-800">
              <strong>Kabul:</strong> Başvuru yeniden değerlendirme kuyruğuna alındı; onay zinciri
              kaldığı yerden devam eder.
            </p>
          )}
          {status === "dismissed" && (
            <p className="mt-3 text-sm text-slate-700">
              <strong>Ret:</strong> İtiraz reddedildi; başvuru kapalı kalır, öğrenci yeniden itiraz
              edemez.
            </p>
          )}
          {appeal?.reviewNote && status !== "pending" && (
            <p className="mt-2 text-xs text-slate-500">
              İnceleme notu: <span className="whitespace-pre-wrap">{appeal.reviewNote}</span>
            </p>
          )}
        </div>
      </div>

      {status === "pending" && (
        <div className="mt-5 space-y-3 border-t border-amber-100 pt-4">
          <p className="text-sm text-slate-600">
            Karar <strong>geri alınamaz</strong>.{" "}
            <span className="font-semibold text-green-800">Kabul</span> → başvuru tekrar açılır;{" "}
            <span className="font-semibold text-red-700">Ret</span> → dosya kapanır.
          </p>
          <div>
            <label htmlFor="appeal-review-note" className="input-label">
              Karar gerekçesi
            </label>
            <textarea
              id="appeal-review-note"
              rows={4}
              className="input-field min-h-[6rem] resize-y"
              placeholder="İtirazı neden kabul veya reddettiğinizi yazın…"
              {...register("note")}
            />
            {errors.note && <p className="input-error">{errors.note.message}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary text-sm"
              disabled={reviewMutation.isPending}
              onClick={handleSubmit(() => setPendingDecision("upheld"))}
            >
              İtirazı kabul et
            </button>
            <button
              type="button"
              className="btn-ghost text-sm text-slate-600 hover:text-red-600"
              disabled={reviewMutation.isPending}
              onClick={handleSubmit(() => setPendingDecision("dismissed"))}
            >
              İtirazı reddet
            </button>
          </div>
          {reviewMutation.isError && (
            <div className="alert-error text-sm">
              {getErrorMessage(reviewMutation.error, "İtiraz incelenemedi.")}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={pendingDecision === "upheld"}
        title="İtiraz kabul edilsin mi?"
        description="Başvuru yeniden değerlendirme kuyruğuna alınır (pending). Bu karar geri alınamaz."
        confirmLabel="Kabul Et ve Başvuruyu Aç"
        tone="primary"
        loading={reviewMutation.isPending}
        error={
          reviewMutation.isError && pendingDecision === "upheld"
            ? getErrorMessage(reviewMutation.error, "İtiraz incelenemedi.")
            : null
        }
        onConfirm={() => submitReview("upheld")}
        onClose={() => {
          setPendingDecision(null);
          reviewMutation.reset();
        }}
      />

      <ConfirmDialog
        open={pendingDecision === "dismissed"}
        title="İtiraz reddedilsin mi?"
        description="Başvuru reddedilmiş olarak kalır ve itiraz kapanır. Bu karar geri alınamaz."
        confirmLabel="İtirazı Reddet"
        loading={reviewMutation.isPending}
        error={
          reviewMutation.isError && pendingDecision === "dismissed"
            ? getErrorMessage(reviewMutation.error, "İtiraz incelenemedi.")
            : null
        }
        onConfirm={() => submitReview("dismissed")}
        onClose={() => {
          setPendingDecision(null);
          reviewMutation.reset();
        }}
      />
    </section>
  );
}
