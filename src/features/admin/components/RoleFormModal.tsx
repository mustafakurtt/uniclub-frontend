import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Modal from "@/shared/ui/Modal";
import { useRankActor } from "@/features/admin/useRankActor";
import { canSetRoleRank } from "@/features/admin/rank";

// Rol oluşturma/düzenleme formu (docs/FRONTEND_YONETIM.md §6.2 +
// FRONTEND_RUTBE_VE_PLATFORM.md §3). Ad + açıklama + rütbe.
//
// Çekirdek (sistem) rollerinin adı VE rütbesi değiştirilemez → `lockName`,
// `lockRank`. Yeni rol yalnızca aktörün kendi maxRank'inden DÜŞÜK bir rütbede
// oluşturulabilir; aşarsa backend 400 döner, biz önden engelliyoruz.
// university_admin oluştururken backend rolü zorla kendi tenant'ına bağlar.

const roleSchema = z.object({
  name: z.string().trim().min(2, "En az 2 karakter olmalıdır.").max(64, "En fazla 64 karakter."),
  description: z
    .union([z.string().trim().max(256, "En fazla 256 karakter."), z.literal("")])
    .optional(),
  // register("rank", { valueAsNumber: true }) ile number gelir; z.coerce
  // kullanılmaz çünkü şemanın giriş tipini `unknown`a düşürüp resolver'ı bozar.
  rank: z
    .number({ message: "Sayı olmalıdır." })
    .int("Tam sayı olmalıdır.")
    .min(0, "En az 0 olabilir.")
    .max(100, "En fazla 100 olabilir."),
});

export type RoleFormValues = z.infer<typeof roleSchema>;

interface RoleFormModalProps {
  open: boolean;
  title: string;
  defaultValues?: Partial<RoleFormValues>;
  /** true → ad alanı salt-okunur (çekirdek rol düzenleme). */
  lockName?: boolean;
  /** true → rütbe salt-okunur (çekirdek rolün rütbesi sabittir). */
  lockRank?: boolean;
  submitLabel?: string;
  error?: string | null;
  onSubmit: (values: RoleFormValues) => Promise<unknown> | void;
  onClose: () => void;
}

export default function RoleFormModal({
  open,
  title,
  defaultValues,
  lockName = false,
  lockRank = false,
  submitLabel = "Kaydet",
  error,
  onSubmit,
  onClose,
}: RoleFormModalProps) {
  const actor = useRankActor();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: "", description: "", rank: 0, ...defaultValues },
  });

  useEffect(() => {
    if (open) reset({ name: "", description: "", rank: 0, ...defaultValues });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Rütbe tavanı: kendi seviyene eşit ya da üstünde rol tanımlayamazsın (§3).
  const rankValue = Number(watch("rank") ?? 0);
  const rankTooHigh = !lockRank && !canSetRoleRank(actor, rankValue);
  const maxAllowed = actor.isSuperAdmin ? 100 : Math.max(0, actor.maxRank - 1);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={isSubmitting}>
            Vazgeç
          </button>
          <button
            type="submit"
            form="role-form-modal"
            className="btn-primary"
            disabled={isSubmitting || rankTooHigh}
          >
            {isSubmitting ? "Kaydediliyor..." : submitLabel}
          </button>
        </>
      }
    >
      {error && <div className="alert-error mb-4">{error}</div>}
      <form id="role-form-modal" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="input-label">Rol Adı (anahtar)</label>
          <input
            {...register("name")}
            className="input-field font-mono"
            placeholder="etkinlik_koordinatoru"
            readOnly={lockName}
            autoFocus={!lockName}
          />
          {lockName && (
            <p className="mt-1 text-xs text-slate-400">Sistem rolünün adı değiştirilemez.</p>
          )}
          {errors.name && <p className="input-error">{errors.name.message}</p>}
        </div>

        <div>
          <label className="input-label">Açıklama</label>
          <input {...register("description")} className="input-field" placeholder="Kısa açıklama" />
          {errors.description && <p className="input-error">{errors.description.message}</p>}
        </div>

        <div>
          <label className="input-label">Yetki Derecesi (rütbe)</label>
          <input
            {...register("rank", { valueAsNumber: true })}
            type="number"
            min={0}
            max={100}
            className="input-field"
            readOnly={lockRank}
          />
          <p className="mt-1 text-xs text-slate-400">
            {lockRank
              ? "Sistem rolünün yetki seviyesi değiştirilemez."
              : `0–100 arası; yüksek olan daha yetkilidir. En fazla ${maxAllowed} verebilirsin.`}
          </p>
          {rankTooHigh && (
            <p className="input-error">
              Bir rolü kendi yetki seviyenize eşit ya da üstüne çıkaramazsınız.
            </p>
          )}
          {errors.rank && <p className="input-error">{errors.rank.message}</p>}
        </div>
      </form>
    </Modal>
  );
}
