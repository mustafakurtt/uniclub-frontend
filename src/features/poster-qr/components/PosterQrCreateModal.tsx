import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import Modal from "@/shared/ui/Modal";
import { getClubActivities } from "@/features/activities/api/activities";
import { getAdminClubs } from "@/features/admin/api/clubs";
import type { CreatePosterQrDto, PosterQrTargetType } from "@/shared/types";

const schema = z
  .object({
    sourceLabel: z.string().min(1, "Kaynak etiketi gerekli.").max(128),
    targetType: z.enum(["club", "activity"]),
    targetClubId: z.string().optional(),
    targetActivityId: z.string().optional(),
    validFrom: z.string().optional(),
    validUntil: z.string().optional(),
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

interface PosterQrCreateModalProps {
  open: boolean;
  scope: "club" | "university";
  clubId?: string;
  universityId?: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (dto: CreatePosterQrDto) => Promise<void>;
  onClose: () => void;
}

export default function PosterQrCreateModal({
  open,
  scope,
  clubId,
  universityId,
  loading,
  error,
  onSubmit,
  onClose,
}: PosterQrCreateModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      sourceLabel: "",
      targetType: scope === "club" ? "club" : "club",
      targetClubId: scope === "club" ? clubId : "",
      targetActivityId: "",
    },
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
    const dto: CreatePosterQrDto = {
      sourceLabel: values.sourceLabel.trim(),
      targetType: values.targetType,
      ...(values.targetType === "club"
        ? { targetClubId: values.targetClubId || clubId }
        : { targetActivityId: values.targetActivityId }),
      ...(values.validFrom ? { validFrom: new Date(values.validFrom).toISOString() } : {}),
      ...(values.validUntil ? { validUntil: new Date(values.validUntil).toISOString() } : {}),
    };
    await onSubmit(dto);
    reset();
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Afiş QR Oluştur"
      description="Kod sabit kalır; afiş basıldıktan sonra hedefi değiştirebilirsiniz."
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            İptal
          </button>
          <button type="button" className="btn-primary" disabled={loading} onClick={() => void submit()}>
            {loading ? "Oluşturuluyor…" : "Oluştur"}
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => void submit(e)}>
        <div>
          <label className="input-label" htmlFor="sourceLabel">
            Kaynak etiketi
          </label>
          <input
            id="sourceLabel"
            className="input-field"
            placeholder='Örn. "A blok panosu", "kantin"'
            {...register("sourceLabel")}
          />
          {errors.sourceLabel && <p className="input-error">{errors.sourceLabel.message}</p>}
        </div>

        <div>
          <label className="input-label">Hedef</label>
          <div className="mt-1 flex flex-wrap gap-2">
            <label className="chip cursor-pointer has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700">
              <input
                type="radio"
                value="club"
                className="sr-only"
                {...register("targetType")}
                onChange={() => {
                  setValue("targetType", "club");
                  if (scope === "club" && clubId) setValue("targetClubId", clubId);
                }}
              />
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
            <label className="input-label" htmlFor="targetClubId">
              Kulüp
            </label>
            <select id="targetClubId" className="input-field" {...register("targetClubId")}>
              <option value="">Seçin…</option>
              {clubsQuery.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.targetClubId && <p className="input-error">{errors.targetClubId.message}</p>}
          </div>
        )}

        {targetType === "activity" && (
          <>
            {scope === "university" && (
              <div>
                <label className="input-label" htmlFor="activityClubId">
                  Kulüp (etkinlik sahibi)
                </label>
                <select
                  id="activityClubId"
                  className="input-field"
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
                </select>
              </div>
            )}
            <div>
              <label className="input-label" htmlFor="targetActivityId">
                Etkinlik
              </label>
              <select id="targetActivityId" className="input-field" {...register("targetActivityId")}>
                <option value="">Seçin…</option>
                {publishedActivities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
              {errors.targetActivityId && (
                <p className="input-error">{errors.targetActivityId.message}</p>
              )}
            </div>
          </>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="input-label" htmlFor="validFrom">
              Geçerlilik başlangıcı (isteğe bağlı)
            </label>
            <input id="validFrom" type="datetime-local" className="input-field" {...register("validFrom")} />
          </div>
          <div>
            <label className="input-label" htmlFor="validUntil">
              Geçerlilik bitişi (isteğe bağlı)
            </label>
            <input id="validUntil" type="datetime-local" className="input-field" {...register("validUntil")} />
          </div>
        </div>

        {error && <div className="alert-error">{error}</div>}
      </form>
    </Modal>
  );
}
