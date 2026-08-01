import { approverRoleLabel } from "@/features/admin/labels";
import { Icon } from "@/shared/ui/Icon";
import type { TenantSettingView } from "@/shared/types";

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
  const atDefault = value === meta.default;
  const min = meta.min ?? 0;
  const max = meta.max ?? Number.MAX_SAFE_INTEGER;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <label htmlFor={settingKey} className="font-display text-sm font-bold text-slate-900">
            {meta.labelTr}
          </label>
          <p className="mt-0.5 text-xs text-slate-500">
            Varsayılan: {String(meta.default)} · Aralık: {min}–{max}
          </p>
          {readOnly && readOnlyReason && (
            <p className="mt-1 text-xs text-amber-700">{readOnlyReason}</p>
          )}
        </div>
        {!readOnly && !atDefault && (
          <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={onReset}>
            Varsayılana sıfırla
          </button>
        )}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <input
          id={settingKey}
          type="number"
          min={min}
          max={max}
          step={1}
          className="input-field max-w-[8rem]"
          value={value}
          disabled={readOnly}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {dirty && !readOnly && (
          <span className="chip text-[10px] bg-amber-50 text-amber-700 border-amber-100">
            Değiştirildi
          </span>
        )}
      </div>
      {error && <p className="input-error mt-2">{error}</p>}
    </div>
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
  const atDefault =
    JSON.stringify(value) === JSON.stringify(meta.default);

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
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-display text-sm font-bold text-slate-900">{meta.labelTr}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {minSteps}–{maxSteps} kademe · Her kademede karar verici rol
          </p>
          {readOnly && readOnlyReason && (
            <p className="mt-1 text-xs text-amber-700">{readOnlyReason}</p>
          )}
        </div>
        {!readOnly && !atDefault && (
          <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={onReset}>
            Varsayılana sıfırla
          </button>
        )}
      </div>

      <ol className="mt-3 space-y-2">
        {value.map((role, index) => (
          <li key={`${settingKey}-${index}`} className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 w-16">Kademe {index + 1}</span>
            <select
              className="select-field max-w-xs flex-1"
              value={role}
              disabled={readOnly}
              onChange={(e) => updateStep(index, e.target.value)}
            >
              {allowed.map((token) => (
                <option key={token} value={token}>
                  {approverRoleLabel(token)}
                </option>
              ))}
            </select>
            {!readOnly && value.length > minSteps && (
              <button
                type="button"
                className="btn-ghost px-2 py-1 text-xs text-slate-400"
                onClick={() => removeStep(index)}
                aria-label={`Kademe ${index + 1} kaldır`}
              >
                <Icon name="delete" size={14} />
              </button>
            )}
          </li>
        ))}
      </ol>

      {!readOnly && value.length < maxSteps && (
        <button type="button" className="btn-ghost mt-2 text-xs" onClick={addStep}>
          <Icon name="add" size={14} /> Kademe ekle
        </button>
      )}

      {dirty && !readOnly && (
        <p className="mt-2">
          <span className="chip text-[10px] bg-amber-50 text-amber-700 border-amber-100">
            Değiştirildi
          </span>
        </p>
      )}
      {error && <p className="input-error mt-2">{error}</p>}
    </div>
  );
}
