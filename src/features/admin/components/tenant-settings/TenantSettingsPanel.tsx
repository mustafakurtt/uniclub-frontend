import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTenantSettings,
  patchTenantSettings,
} from "@/features/universities/api/tenantSettings";
import {
  TenantIntegerSettingField,
  TenantRoleChainSettingField,
} from "@/features/admin/components/tenant-settings/TenantSettingFields";
import { getErrorMessage } from "@/shared/api/client";
import type { TenantSettingsPatch, TenantSettingsResponse } from "@/shared/types";

const PLATFORM_READONLY_REASON =
  "Bu ayar yalnızca platform operatörü tarafından düzenlenebilir.";

type DraftValues = Record<string, number | string[]>;

function valuesFromResponse(data: TenantSettingsResponse): DraftValues {
  const out: DraftValues = {};
  for (const [key, meta] of Object.entries(data)) {
    out[key] = meta.value;
  }
  return out;
}

function validateDraft(
  data: TenantSettingsResponse,
  draft: DraftValues
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [key, meta] of Object.entries(data)) {
    if (meta.editor === "platform") continue;
    const value = draft[key];
    if (meta.kind === "integer" && typeof value === "number") {
      const min = meta.min ?? 0;
      const max = meta.max ?? Number.MAX_SAFE_INTEGER;
      if (value < min || value > max) {
        errors[key] = `Değer ${min} ile ${max} arasında olmalıdır.`;
      }
    }
    if (meta.kind === "role_chain" && Array.isArray(value)) {
      if (value.length < 1 || value.length > 3) {
        errors[key] = "Onay zinciri 1 ile 3 kademe arasında olmalıdır.";
      }
    }
  }
  return errors;
}

interface TenantSettingsPanelProps {
  universityId: string;
}

export default function TenantSettingsPanel({ universityId }: TenantSettingsPanelProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<DraftValues | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const settingsQuery = useQuery({
    queryKey: ["tenant-settings", universityId],
    queryFn: () => getTenantSettings(universityId),
  });

  const serverData = settingsQuery.data;
  const currentValues = draft ?? (serverData ? valuesFromResponse(serverData) : {});

  const dirtyKeys = useMemo(() => {
    if (!serverData) return new Set<string>();
    const values = draft ?? valuesFromResponse(serverData);
    const dirty = new Set<string>();
    for (const [key, meta] of Object.entries(serverData)) {
      const cur = values[key];
      if (JSON.stringify(cur) !== JSON.stringify(meta.value)) dirty.add(key);
    }
    return dirty;
  }, [serverData, draft]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!serverData) return;
      const clientErrors = validateDraft(serverData, currentValues);
      setFieldErrors(clientErrors);
      if (Object.keys(clientErrors).length > 0) {
        throw new Error("validation");
      }

      const patch: TenantSettingsPatch = {};
      for (const key of dirtyKeys) {
        const meta = serverData[key];
        const cur = currentValues[key];
        if (JSON.stringify(cur) === JSON.stringify(meta.default)) {
          patch[key] = null;
        } else {
          patch[key] = cur as number | string[];
        }
      }
      if (Object.keys(patch).length === 0) return serverData;
      return patchTenantSettings(universityId, patch);
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(["tenant-settings", universityId], data);
        setDraft(null);
        setFieldErrors({});
      }
    },
  });

  const setFieldValue = (key: string, value: number | string[]) => {
    setDraft((prev) => ({
      ...(serverData ? valuesFromResponse(serverData) : {}),
      ...prev,
      [key]: value,
    }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const resetField = (key: string) => {
    if (!serverData) return;
    setFieldValue(key, serverData[key].default as number | string[]);
  };

  if (settingsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-24 w-full" />
      </div>
    );
  }

  if (settingsQuery.isError || !serverData) {
    return (
      <div className="alert-error">
        {getErrorMessage(settingsQuery.error, "Ayarlar yüklenemedi.")}
      </div>
    );
  }

  const entries = Object.entries(serverData);

  return (
    <div className="space-y-4">
      {entries.map(([key, meta]) => {
        const readOnly = meta.editor === "platform";
        const value = currentValues[key];
        const dirty = dirtyKeys.has(key);

        if (meta.kind === "role_chain" && Array.isArray(value)) {
          return (
            <TenantRoleChainSettingField
              key={key}
              settingKey={key}
              meta={meta}
              value={value}
              readOnly={readOnly}
              readOnlyReason={readOnly ? PLATFORM_READONLY_REASON : undefined}
              dirty={dirty}
              onChange={(v) => setFieldValue(key, v)}
              onReset={() => resetField(key)}
              error={fieldErrors[key]}
            />
          );
        }

        if (meta.kind === "integer" && typeof value === "number") {
          return (
            <TenantIntegerSettingField
              key={key}
              settingKey={key}
              meta={meta}
              value={value}
              readOnly={readOnly}
              readOnlyReason={readOnly ? PLATFORM_READONLY_REASON : undefined}
              dirty={dirty}
              onChange={(v) => setFieldValue(key, v)}
              onReset={() => resetField(key)}
              error={fieldErrors[key]}
            />
          );
        }

        return null;
      })}

      {saveMutation.isError &&
        saveMutation.error instanceof Error &&
        saveMutation.error.message !== "validation" && (
          <div className="alert-error">
            {getErrorMessage(saveMutation.error, "Ayarlar kaydedilemedi.")}
          </div>
        )}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          className="btn-ghost"
          disabled={dirtyKeys.size === 0 || saveMutation.isPending}
          onClick={() => {
            setDraft(null);
            setFieldErrors({});
          }}
        >
          Değişiklikleri geri al
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={dirtyKeys.size === 0 || saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
