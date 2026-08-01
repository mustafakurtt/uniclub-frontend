import { useForm } from "react-hook-form";
import SelectField from "@/shared/ui/SelectField";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import Modal from "@/shared/ui/Modal";
import { getClubActivities } from "@/features/activities/api/activities";
import { getAdminClubs } from "@/features/admin/api/clubs";
import type { PosterQrCode, PosterQrTargetType, UpdatePosterQrDto } from "@/shared/types";

const schema = z
  .object({
    targetType: z.enum(["club", "activity"]),
    targetClubId: z.string().optional(),
    targetActivityId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.targetType === "club" && !data.targetClubId) {
      ctx.addIssue({ code: "custom", message: "Kulüp seçin.", path: ["targetClubId"] });
    }
    if (data.targetType === "activity" && !data.targetActivityId) {
      ctx.addIssue({ code: "custom", message: "Etkinlik seçin.", path: ["targetActivityId"] });
    }
  });

type FormValues = z.infer<typeof schema>;

interface PosterQrRetargetModalProps {
  open: boolean;
  qr: PosterQrCode | null;
  scope: "club" | "university";
  clubId?: string;
  universityId?: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (dto: UpdatePosterQrDto) => Promise<void>;
  onClose: () => void;
}

export default function PosterQrRetargetModal({
  open,
  qr,
  scope,
  clubId,
  universityId,
  loading,
  error,
  onSubmit,
  onClose,
}: PosterQrRetargetModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: qr
      ? {
          targetType: qr.targetType,
          targetClubId: qr.targetClubId ?? (scope === "club" ? clubId : "") ?? "",
          targetActivityId: qr.targetActivityId ?? "",
        }
      : undefined,
  });

  const targetType = watch("targetType") as PosterQrTargetType;
  const selectedClubId = watch("targetClubId");

  const clubsQuery = useQuery({
    queryKey: ["admin", universityId, "clubs", "approved"],
    queryFn: () => getAdminClubs(universityId!, "approved"),
    enabled: open && scope === "university" && !!universityId,
  });

  const activitiesQuery = useQuery({
    queryKey: ["clubs", selectedClubId ?? clubId, "activities"],
    queryFn: () => getClubActivities(selectedClubId || clubId!),
    enabled: open && targetType === "activity" && !!(selectedClubId || clubId),
  });

  const publishedActivities =
    activitiesQuery.data?.filter((a) => a.status === "published") ?? [];

  const submit = handleSubmit(async (values) => {
    const dto: UpdatePosterQrDto = {
      targetType: values.targetType,
      targetClubId: values.targetType === "club" ? values.targetClubId || clubId : null,
      targetActivityId: values.targetType === "activity" ? values.targetActivityId : null,
    };
    await onSubmit(dto);
    reset();
  });

  if (!qr) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Hedefi Değiştir"
      description={`"${qr.sourceLabel}" — QR kodu aynı kalır, yalnızca yönlendirme hedefi güncellenir.`}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            İptal
          </button>
          <button type="button" className="btn-primary" disabled={loading} onClick={() => void submit()}>
            {loading ? "Kaydediliyor…" : "Hedefi Güncelle"}
          </button>
        </>
      }
    >
      <div className="mb-4 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 text-sm text-brand-900">
        <strong>Neden hedef değiştirme?</strong> Afiş basıldıktan sonra etkinlik tarihi veya
        kulüp etkinliği değişirse yeni afiş basmanız gerekmez — aynı QR kodunu yeni hedefe
        yönlendirmeniz yeterlidir.
      </div>

      <form className="space-y-4" onSubmit={(e) => void submit(e)}>
        <div>
          <label className="input-label">Yeni hedef</label>
          <div className="mt-1 flex flex-wrap gap-2">
            <label className="chip cursor-pointer has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700">
              <input type="radio" value="club" className="sr-only" {...register("targetType")} />
              Kulüp sayfası
            </label>
            <label className="chip cursor-pointer has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700">
              <input type="radio" value="activity" className="sr-only" {...register("targetType")} />
              Etkinlik
            </label>
          </div>
        </div>

        {scope === "university" && targetType === "club" && (
          <div>
            <label className="input-label">Kulüp</label>
            <SelectField className="select-field" {...register("targetClubId")}>
              <option value="">Seçin…</option>
              {clubsQuery.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </SelectField>
            {errors.targetClubId && <p className="input-error">{errors.targetClubId.message}</p>}
          </div>
        )}

        {targetType === "activity" && (
          <>
            {scope === "university" && (
              <div>
                <label className="input-label">Kulüp</label>
                <SelectField
                  className="select-field"
                  value={selectedClubId ?? ""}
                  onChange={(e) => {
                    setValue("targetClubId", e.target.value);
                    setValue("targetActivityId", "");
                  }}
                >
                  <option value="">Seçin…</option>
                  {clubsQuery.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </SelectField>
              </div>
            )}
            <div>
              <label className="input-label">Etkinlik</label>
              <SelectField className="select-field" {...register("targetActivityId")}>
                <option value="">Seçin…</option>
                {publishedActivities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </SelectField>
              {errors.targetActivityId && (
                <p className="input-error">{errors.targetActivityId.message}</p>
              )}
            </div>
          </>
        )}

        {error && <div className="alert-error">{error}</div>}
      </form>
    </Modal>
  );
}
