import { z } from "zod";

const visibilityEnum = z.enum(["university", "members"]);

export const activityFormSchema = z
  .object({
    title: z.string().trim().min(3, "En az 3 karakter.").max(256, "En fazla 256 karakter."),
    description: z.string().trim().max(5000, "En fazla 5000 karakter.").optional(),
    location: z.string().trim().max(512, "En fazla 512 karakter.").optional(),
    coverUrl: z
      .string()
      .trim()
      .url("Geçerli bir URL giriniz.")
      .max(512)
      .optional()
      .or(z.literal("")),
    startsAtLocal: z.string().min(1, "Başlangıç tarihi zorunludur."),
    endsAtLocal: z.string().optional(),
    capacity: z
      .string()
      .optional()
      .refine((v) => !v || (/^\d+$/.test(v) && Number(v) > 0), "Pozitif tam sayı giriniz."),
    visibility: visibilityEnum,
  })
  .refine(
    (data) => {
      if (!data.endsAtLocal) return true;
      return new Date(data.endsAtLocal) >= new Date(data.startsAtLocal);
    },
    { message: "Bitiş başlangıçtan önce olamaz.", path: ["endsAtLocal"] }
  );

export type ActivityFormValues = z.infer<typeof activityFormSchema>;

export function toActivityApiPayload(values: ActivityFormValues) {
  return {
    title: values.title,
    description: values.description || undefined,
    location: values.location || undefined,
    coverUrl: values.coverUrl || undefined,
    startsAt: new Date(values.startsAtLocal).toISOString(),
    endsAt: values.endsAtLocal ? new Date(values.endsAtLocal).toISOString() : undefined,
    capacity: values.capacity ? Number(values.capacity) : undefined,
    visibility: values.visibility,
  };
}

export const activityCancelSchema = z.object({
  reason: z.string().trim().min(3, "İptal gerekçesi en az 3 karakter olmalıdır.").max(500),
});

export type ActivityCancelValues = z.infer<typeof activityCancelSchema>;
