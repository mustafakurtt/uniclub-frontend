import type { ReactNode } from "react";
import { approverRoleLabel } from "@/features/admin/labels";
import { settingDescription } from "@/features/admin/components/tenant-settings/settingMeta";
import SelectField from "@/shared/ui/SelectField";
import { Icon } from "@/shared/ui/Icon";
import type { TenantSettingView } from "@/shared/types";

interface SettingShellProps {
  settingKey: string;
  meta: TenantSettingView;
  readOnly: boolean;
  readOnlyReason?: string;
  dirty: boolean;
  showReset: boolean;
  onReset: () => void;
  error?: string;
  children: ReactNode;
}

function SettingShell({
  settingKey,
  meta,
  readOnly,
  readOnlyReason,
  dirty,
  showReset,
  onReset,
  error,
  children,
}: SettingShellProps) {
  return (
    <article
      className={`rounded-2xl border p-5 transition-colors ${
        readOnly
          ? "border-slate-100 bg-slate-50/80"
          : dirty
            ? "border-amber-200 bg-amber-50/30"
            : "border-slate-100 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-sm font-bold text-slate-900">{meta.labelTr}</h3>
            {readOnly && (
              <span className="chip border-slate-200 bg-slate-100 text-[10px] text-slate-600">
                <Icon name="lock" size={10} className="mr-0.5" />
                Salt okunur
              </span>
            )}
            {dirty && !readOnly && (
              <span className="chip border-amber-100 bg-amber-50 text-[10px] text-amber-700">
                Kaydedilmedi
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            {settingDescription(settingKey, meta)}
          </p>
          {readOnly && readOnlyReason && (
            <p className="mt-2 text-xs text-amber-800">{readOnlyReason}</p>
          )}
        </div>
        {!readOnly && showReset && (
          <button type="button" className="btn-ghost shrink-0 px-2 py-1 text-xs" onClick={onReset}>
            Varsayılana dön
          </button>
        )}
      </div>

      <div className="mt-4">{children}</div>
      {error && <p className="input-error mt-3">{error}</p>}
    </article>
  );
}

interface TenantIntegerSettingFieldProps {
  settingKey: string;
  meta: TenantSettingView;
  value: number;
  readOnly: boolean;
  readOnlyReason?: string;
  dirty: boolean;
  onChange: (value: number) => void;
  onReset: () => void;
  error?: string;
}

export function TenantIntegerSettingField({
  settingKey,
  meta,
  value,
  readOnly,
  readOnlyReason,
  dirty,
  onChange,
  onReset,
  error,
}: TenantIntegerSettingFieldProps) {
  const min = meta.min ?? 0;
  const max = meta.max ?? Number.MAX_SAFE_INTEGER;
  const atDefault = value === meta.default;
  const span = max - min || 1;
  const fillPct = Math.min(100, Math.max(0, ((value - min) / span) * 100));

  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  return (
    <SettingShell
      settingKey={settingKey}
      meta={meta}
      readOnly={readOnly}
      readOnlyReason={readOnlyReason}
      dirty={dirty}
      showReset={!atDefault}
      onReset={onReset}
      error={error}
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-lg font-bold text-slate-500 transition-colors hover:bg-white hover:text-brand-700 disabled:opacity-40"
            disabled={readOnly || value <= min}
            onClick={() => onChange(clamp(value - 1))}
            aria-label="Azalt"
          >
            −
          </button>
          <input
            id={settingKey}
            type="number"
            min={min}
            max={max}
            step={1}
            className="w-16 border-0 bg-transparent text-center font-display text-lg font-bold text-slate-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            value={value}
            disabled={readOnly}
            onChange={(e) => onChange(clamp(Number(e.target.value)))}
          />
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-lg font-bold text-slate-500 transition-colors hover:bg-white hover:text-brand-700 disabled:opacity-40"
            disabled={readOnly || value >= max}
            onClick={() => onChange(clamp(value + 1))}
            aria-label="Artır"
          >
            +
          </button>
        </div>

        <div className="min-w-[10rem] flex-1">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <span>{min}</span>
            <span className="text-slate-500 normal-case tracking-normal">
              Varsayılan: <strong className="text-slate-700">{String(meta.default)}</strong>
            </span>
            <span>{max}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-200"
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>
      </div>
    </SettingShell>
  );
}

interface TenantRoleChainSettingFieldProps {
  settingKey: string;
  meta: TenantSettingView;
  value: string[];
  readOnly: boolean;
  readOnlyReason?: string;
  dirty: boolean;
  onChange: (value: string[]) => void;
  onReset: () => void;
  error?: string;
}

export function TenantRoleChainSettingField({
  settingKey,
  meta,
  value,
  readOnly,
  readOnlyReason,
  dirty,
  onChange,
  onReset,
  error,
}: TenantRoleChainSettingFieldProps) {
  const allowed = meta.allowedRoles ?? [];
  const minSteps = 1;
  const maxSteps = 3;
  const atDefault = JSON.stringify(value) === JSON.stringify(meta.default);

  const updateStep = (index: number, role: string) => {
    const next = [...value];
    next[index] = role;
    onChange(next);
  };

  const addStep = () => {
    if (value.length >= maxSteps || readOnly) return;
    const fallback = allowed[0] ?? "club_approver";
    onChange([...value, fallback]);
  };

  const removeStep = (index: number) => {
    if (value.length <= minSteps || readOnly) return;
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <SettingShell
      settingKey={settingKey}
      meta={meta}
      readOnly={readOnly}
      readOnlyReason={readOnlyReason}
      dirty={dirty}
      showReset={!atDefault}
      onReset={onReset}
      error={error}
    >
      <ol className="space-y-0">
        {value.map((role, index) => (
          <li key={`${settingKey}-${index}`} className="relative flex gap-3 pb-4 last:pb-0">
            {index < value.length - 1 && (
              <span
                className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px bg-brand-200"
                aria-hidden
              />
            )}
            <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-glow">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                {index === value.length - 1 ? "Son onay" : `${index + 1}. kademe`}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <SelectField
                  className="select-field max-w-md flex-1"
                  value={role}
                  disabled={readOnly}
                  onChange={(e) => updateStep(index, e.target.value)}
                >
                  {allowed.map((token) => (
                    <option key={token} value={token}>
                      {approverRoleLabel(token)}
                    </option>
                  ))}
                </SelectField>
                {!readOnly && value.length > minSteps && (
                  <button
                    type="button"
                    className="btn-ghost px-2 py-1 text-xs text-slate-400"
                    onClick={() => removeStep(index)}
                    aria-label={`${index + 1}. kademeyi kaldır`}
                  >
                    <Icon name="delete" size={14} />
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      {!readOnly && value.length < maxSteps && (
        <button type="button" className="btn-ghost mt-3 text-xs" onClick={addStep}>
          <Icon name="add" size={14} /> Kademe ekle ({value.length}/{maxSteps})
        </button>
      )}

      <p className="mt-3 text-xs text-slate-500">
        Başvuru önce 1. kademeye düşer; onaylandıkça sıradaki role iletilir. En fazla{" "}
        {maxSteps} kademe tanımlanabilir.
      </p>
    </SettingShell>
  );
}
