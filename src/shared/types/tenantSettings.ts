// Tenant ayarları — GET/PATCH /api/universities/:universityId/settings
// (docs/FRONTEND_TENANT_SETTINGS.md). Anahtarlar runtime katalogdan gelir;
// bu tipler yanıt şeklini tanımlar.

export type TenantSettingEditor = "tenant" | "platform";
export type TenantSettingKind = "integer" | "role_chain" | "boolean";

export interface TenantSettingView {
  value: number | string[] | boolean;
  default: number | string[] | boolean;
  kind: TenantSettingKind;
  min?: number;
  max?: number;
  allowedRoles?: readonly string[];
  editor: TenantSettingEditor;
  labelTr: string;
  labelEn: string;
}

export type TenantSettingsResponse = Record<string, TenantSettingView>;

/** PATCH gövdesi — null = varsayılana sıfırla. */
export type TenantSettingsPatch = Record<string, number | string[] | boolean | null>;
