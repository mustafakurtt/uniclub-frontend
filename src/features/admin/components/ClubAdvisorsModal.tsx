import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "@/shared/ui/Modal";
import EmptyState from "@/shared/ui/EmptyState";
import {
  assignClubAdvisor,
  getAdminUsers,
  getClubAdvisors,
  removeClubAdvisor,
} from "@/features/admin/api";
import { getErrorMessage } from "@/shared/api/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { Club } from "@/shared/types";

// Danışman yönetimi (FRONTEND_YONETIM.md §5.4) — `club.advisor.manage` yetkisi.
// Kurallar: hedef aynı üniversiteden ve global `advisor` rolünde olmalı (öğrenci
// atanamaz — backend reddeder, mesajı doğrudan gösteririz). Adaylar `?role=advisor`
// filtresiyle çekilir (`user.view`); metinle daraltma istemci tarafında yapılır.

interface ClubAdvisorsModalProps {
  open: boolean;
  universityId: string;
  club: Club | null;
  onClose: () => void;
}

export default function ClubAdvisorsModal({ open, universityId, club, onClose }: ClubAdvisorsModalProps) {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState("");
  const canSearchUsers = hasPermission("user.view");
  const clubId = club?.id ?? "";

  const advisorsQuery = useQuery({
    queryKey: ["admin", universityId, "clubs", clubId, "advisors"],
    queryFn: () => getClubAdvisors(universityId, clubId),
    enabled: open && !!clubId,
  });

  // Yalnızca `advisor` rolündeki personel danışman olabilir → liste bu filtreyle
  // gelir; metin araması istemci tarafında (backend serbest-metin desteklemez).
  const candidatesQuery = useQuery({
    queryKey: ["admin", universityId, "users", { role: "advisor" }],
    queryFn: () => getAdminUsers(universityId, { role: "advisor" }),
    enabled: open && canSearchUsers,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", universityId, "clubs", clubId, "advisors"] });

  const assignMutation = useMutation({
    mutationFn: (userId: string) => assignClubAdvisor(universityId, clubId, userId),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeClubAdvisor(universityId, clubId, userId),
    onSuccess: invalidate,
  });

  const advisors = advisorsQuery.data ?? [];
  const advisorIds = new Set(advisors.map((a) => a.id));
  const query = search.trim().toLocaleLowerCase("tr-TR");
  const candidates = (candidatesQuery.data ?? [])
    .filter((u) => !advisorIds.has(u.id))
    .filter((u) =>
      query.length < 2
        ? false
        : `${u.firstName} ${u.lastName} ${u.email}`.toLocaleLowerCase("tr-TR").includes(query)
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Danışmanlar — ${club?.name ?? ""}`}
      description="Yalnızca 'advisor' rolündeki personel atanabilir; danışman kulübün üyesi sayılmaz."
      footer={
        <button type="button" className="btn-ghost" onClick={onClose}>
          Kapat
        </button>
      }
    >
      {(assignMutation.isError || removeMutation.isError) && (
        <div className="alert-error mb-4">
          {getErrorMessage(
            assignMutation.error ?? removeMutation.error,
            "Danışman işlemi gerçekleştirilemedi."
          )}
        </div>
      )}

      {/* Mevcut danışmanlar */}
      {advisorsQuery.isLoading ? (
        <div className="skeleton h-12 w-full" />
      ) : advisors.length === 0 ? (
        <EmptyState icon="advisor" title="Danışman atanmamış" />
      ) : (
        <ul className="divide-y divide-slate-100">
          {advisors.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {a.firstName} {a.lastName}
                </p>
                <p className="truncate text-xs text-slate-400">{a.email}</p>
              </div>
              <button
                className="btn-ghost shrink-0 px-3 py-1.5 text-xs text-slate-400 hover:text-red-600"
                disabled={removeMutation.isPending}
                onClick={() => removeMutation.mutate(a.id)}
              >
                Kaldır
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Aday arama */}
      {canSearchUsers && (
        <div className="mt-6">
          <label className="input-label">Danışman Ata</label>
          <input
            className="input-field"
            placeholder="Ad ya da e-posta ile ara (en az 2 karakter)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {candidatesQuery.isLoading && <div className="skeleton mt-3 h-10 w-full" />}
          {candidatesQuery.isError && (
            <p className="input-error mt-2">
              {getErrorMessage(candidatesQuery.error, "Kullanıcılar aranamadı.")}
            </p>
          )}
          {candidates.length > 0 && (
            <ul className="mt-3 max-h-52 divide-y divide-slate-100 overflow-y-auto rounded-2xl border border-slate-100">
              {candidates.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="truncate text-xs text-slate-400">{u.email}</p>
                  </div>
                  <button
                    className="btn-secondary shrink-0 px-3 py-1.5 text-xs"
                    disabled={assignMutation.isPending}
                    onClick={() => assignMutation.mutate(u.id)}
                  >
                    + Ata
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Modal>
  );
}
