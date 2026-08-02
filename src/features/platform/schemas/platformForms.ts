import { z } from "zod";

const domainSchema = z.object({
  domain: z.string().trim().toLowerCase().min(3, "Domain en az 3 karakter.").max(256),
  domainType: z.enum(["student", "staff"]),
});

const initialAdminSchema = z.object({
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin."),
});

export const onboardTenantFormSchema = z
  .object({
    name: z.string().trim().min(2).max(256),
    slug: z.string().trim().min(2).max(256),
    status: z.enum(["trial", "active", "past_due", "suspended"]),
    domains: z.array(domainSchema).min(1, "En az bir e-posta alan adı (domain) ekleyin."),
    includeInitialAdmin: z.boolean(),
    initialAdmin: initialAdminSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.includeInitialAdmin) {
      if (!data.initialAdmin) {
        ctx.addIssue({
          code: "custom",
          message: "İlk yönetici bilgilerini doldurun.",
          path: ["initialAdmin"],
        });
        return;
      }
      const hasStaff = data.domains.some((d) => d.domainType === "staff");
      if (!hasStaff) {
        ctx.addIssue({
          code: "custom",
          message: "İlk yönetici için en az bir personel (staff) domaini gerekir.",
          path: ["domains"],
        });
      }
    }
  });

export type OnboardTenantFormValues = z.infer<typeof onboardTenantFormSchema>;

export const inviteTenantAdminFormSchema = initialAdminSchema;

export type InviteTenantAdminFormValues = z.infer<typeof inviteTenantAdminFormSchema>;

export const tenantStatusFormSchema = z.object({
  reason: z.string().trim().min(3, "Gerekçe en az 3 karakter.").max(500),
});

export type TenantStatusFormValues = z.infer<typeof tenantStatusFormSchema>;

export const createPlatformUserFormSchema = z.object({
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin."),
  password: z.string().min(12, "Şifre en az 12 karakter olmalıdır."),
  role: z.enum(["super_admin", "platform_support"]),
});

export type CreatePlatformUserFormValues = z.infer<typeof createPlatformUserFormSchema>;
