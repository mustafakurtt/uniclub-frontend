// Kişi bazlı yetki override (claim) — `permission.manage`, yalnızca super_admin (§6.4).
// granted:true rolden bağımsız yetki ekler, granted:false rolden geleni iptal eder.
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getPermissions,
  removeUserPermissionOverride,
  setUserPermissionOverride,
} from "@/features/admin/api/rbac";
import { permissionLabel } from "@/features/admin/labels";
import { Icon } from "@/shared/ui/Icon";
import IconButton from "@/shared/ui/IconButton";
import type { AdminUserDetail } from "@/shared/types";
import MutationError from "./MutationError";
import { useInvalidateUserDetail } from "./useUserDetail";

interface Props {
  universityId: string;
  user: AdminUserDetail;
}

export default function PermissionOverridesSection({ universityId, user }: Props) {
  const invalidate = useInvalidateUserDetail(universityId, user.id);
  const [claimKey, setClaimKey] = useState("");
  const [claimGranted, setClaimGranted] = useState(true);

  const permsCatalogQuery = useQuery({ queryKey: ["rbac", "permissions"], queryFn: getPermissions });

  const setClaimMutation = useMutation({
    mutationFn: ({ key, granted }: { key: string; granted: boolean }) =>
      setUserPermissionOverride(user.id, { key, granted }),
    onSuccess: () => {
      invalidate();
      setClaimKey("");
      setClaimGranted(true);
    },
  });

  const removeClaimMutation = useMutation({
    mutationFn: (permissionId: string) => removeUserPermissionOverride(user.id, permissionId),
    onSuccess: invalidate,
  });

  const overriddenPermIds = new Set(user.permissionOverrides.map((o) => o.permissionId));
  const assignableClaims = (permsCatalogQuery.data ?? []).filter(
    (p) => !overriddenPermIds.has(p.id)
  );

  return (
    <section>
      <MutationError error={setClaimMutation.error ?? removeClaimMutation.error} />
      <h3 className="input-label">Kişisel Yetki Override'ları</h3>
      <p className="mb-2 text-xs text-slate-500">
        Rolden bağımsız yetki ekleyin (izin ver) veya rolden geleni iptal edin (reddet).
      </p>
      {user.permissionOverrides.length === 0 ? (
        <p className="text-xs text-slate-400">Kişisel override yok.</p>
      ) : (
        <ul className="mb-3 divide-y divide-slate-100">
          {user.permissionOverrides.map((o) => (
            <li key={o.permissionId} className="flex items-center justify-between gap-3 py-1.5">
              <span className="flex items-center gap-2 text-xs">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    o.granted ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  {o.granted ? "İZİN" : "RED"}
                </span>
                <span className="font-mono text-slate-600">{o.permission.key}</span>
                <span className="text-slate-400">{permissionLabel(o.permission.key)}</span>
              </span>
              <IconButton
                icon="delete"
                label="Override'ı kaldır"
                tone="danger"
                disabled={removeClaimMutation.isPending}
                onClick={() => removeClaimMutation.mutate(o.permissionId)}
              />
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="select-field w-auto text-sm"
          value={claimKey}
          onChange={(e) => setClaimKey(e.target.value)}
          aria-label="Yetki seç"
        >
          <option value="">Yetki seç…</option>
          {assignableClaims.map((p) => (
            <option key={p.id} value={p.key}>
              {p.key}
            </option>
          ))}
        </select>
        <select
          className="select-field w-auto text-sm"
          value={claimGranted ? "grant" : "deny"}
          onChange={(e) => setClaimGranted(e.target.value === "grant")}
          aria-label="Override türü"
        >
          <option value="grant">İzin ver</option>
          <option value="deny">Reddet</option>
        </select>
        <button
          className="btn-secondary px-3 py-1.5 text-xs"
          disabled={!claimKey || setClaimMutation.isPending}
          onClick={() => claimKey && setClaimMutation.mutate({ key: claimKey, granted: claimGranted })}
        >
          <Icon name="add" size={14} /> Uygula
        </button>
      </div>
    </section>
  );
}
