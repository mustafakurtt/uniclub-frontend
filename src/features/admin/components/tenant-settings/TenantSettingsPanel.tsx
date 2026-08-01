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
import { groupSettingsByCategory } from "@/features/admin/components/tenant-settings/settingMeta";
import { getErrorMessage } from "@/shared/api/client";
import PageLoader from "@/shared/ui/PageLoader";
import { Icon } from "@/shared/ui/Icon";
import type { TenantSettingsPatch, TenantSettingsResponse } from "@/shared/types";

const PLATFORM_READONLY_REASON =
  "Bu limit yalnızca platform operatörü tarafından değiştirilebilir.";

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

function renderSettingField(
  key: string,
  meta: TenantSettingsResponse[string],
  currentValues: DraftValues,
  dirtyKeys: Set<string>,
  setFieldValue: (key: string, value: number | string[]) => void,
  resetField: (key: string) => void,
  fieldErrors: Record<string, string>
) {
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

  const grouped = useMemo(
    () => (serverData ? groupSettingsByCategory(Object.entries(serverData)) : []),
    [serverData]
  );

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

  const discardChanges = () => {
    setDraft(null);
    setFieldErrors({});
  };

  if (settingsQuery.isLoading) {
    return <PageLoader label="Politikalar yükleniyor..." />;
  }

  if (settingsQuery.isError || !serverData) {
    return (
      <div className="alert-error">
        {getErrorMessage(settingsQuery.error, "Politikalar yüklenemedi.")}
      </div>
    );
  }

  return (
    <div className="relative pb-24">
      <div className="card overflow-hidden">
        {grouped.map(({ category, items }, sectionIndex) => (
          <section
            key={category.id}
            className={sectionIndex > 0 ? "border-t border-slate-100" : ""}
          >
            <div className="flex items-start gap-3 border-b border-slate-50 bg-gradient-to-r from-brand-50/60 to-transparent px-6 py-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                <Icon name={category.icon} size={20} />
              </span>
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">
                  {category.title}
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">{category.description}</p>
              </div>
            </div>

            <div className="space-y-4 p-6">
              {items.map(([key, meta]) =>
                renderSettingField(
                  key,
                  meta,
                  currentValues,
                  dirtyKeys,
                  setFieldValue,
                  resetField,
                  fieldErrors
                )
              )}
            </div>
          </section>
        ))}
      </div>

      {saveMutation.isError &&
        saveMutation.error instanceof Error &&
        saveMutation.error.message !== "validation" && (
          <div className="alert-error mt-4">
            {getErrorMessage(saveMutation.error, "Politikalar kaydedilemedi.")}
          </div>
        )}

      {dirtyKeys.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-4 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm">
          <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              <strong className="font-semibold text-slate-900">{dirtyKeys.size}</strong> ayar
              değiştirildi — kaydetmeden ayrılırsanız değişiklikler kaybolur.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-ghost"
                disabled={saveMutation.isPending}
                onClick={discardChanges}
              >
                Geri al
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
