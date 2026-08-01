import { z } from "zod";

const visibilityEnum = z.enum(["university", "members"]);

export const announcementFormSchema = z.object({
  title: z.string().trim().min(3, "En az 3 karakter olmalıdır.").max(256, "En fazla 256 karakter."),
  content: z.string().trim().min(1, "İçerik boş olamaz.").max(5000, "En fazla 5000 karakter."),
  visibility: visibilityEnum,
  pinned: z.boolean(),
});

export type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;
