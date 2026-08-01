import { useEffect, useState } from "react";
import Modal from "@/shared/ui/Modal";
import { Icon } from "@/shared/ui/Icon";
import { getAdminUsers } from "@/features/admin/api";
import { committeeMajorityRequiredPreview } from "@/features/admin/committeeLabels";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { ApprovalCommittee } from "@/shared/types";

export interface ApprovalCommitteeFormValues {
  name: string;
  memberUserIds: string[];
  isActive: boolean;
}

interface ApprovalCommitteeFormModalProps {
  open: boolean;
  universityId: string;
  committee: ApprovalCommittee | null;
  loading: boolean;
  error: string | null;
  onSubmit: (values: ApprovalCommitteeFormValues) => void;
  onClose: () => void;
}

export default function ApprovalCommitteeFormModal({
  open,
  universityId,
  committee,
  loading,
  error,
  onSubmit,
  onClose,
}: ApprovalCommitteeFormModalProps) {
  const { hasPermission } = useAuth();
  const canSearchUsers = hasPermission("user.view");
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(committee?.name ?? "");
    setIsActive(committee?.isActive ?? true);
    setMemberIds(committee?.members.map((m) => m.userId) ?? []);
    setSearch("");
  }, [open, committee]);

  const usersQuery = useQuery({
    queryKey: ["admin", universityId, "users", "committee-picker"],
    queryFn: () => getAdminUsers(universityId),
    enabled: open && canSearchUsers,
  });

  const query = search.trim().toLocaleLowerCase("tr-TR");
  const candidates = (usersQuery.data ?? []).filter((u) =>
    query.length < 2
      ? false
      : `${u.firstName} ${u.lastName} ${u.email}`.toLocaleLowerCase("tr-TR").includes(query)
  );

  const selectedUsers = (usersQuery.data ?? []).filter((u) => memberIds.includes(u.id));
  const threshold = committeeMajorityRequiredPreview(memberIds.length);

  const toggleMember = (userId: string) => {
    setMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name: name.trim(), memberUserIds: memberIds, isActive });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={committee ? "Kurulu düzenle" : "Onay kurulu oluştur"}
      description="Kurul üyeleri başvuru zincirinde salt çoğunlukla oy kullanır."
      size="md"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={loading}>
            İptal
          </button>
          <button
            type="submit"
            form="approval-committee-form"
            className="btn-primary"
            disabled={loading || !name.trim() || memberIds.length === 0}
          >
            {loading ? "Kaydediliyor…" : committee ? "Güncelle" : "Oluştur"}
          </button>
        </>
      }
    >
      <form id="approval-committee-form" onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="alert-error">{error}</div>}

        <div>
          <label className="input-label" htmlFor="committee-name">
            Kurul adı
          </label>
          <input
            id="committee-name"
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn. Koordinasyon Kurulu"
            required
          />
        </div>

        {committee && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-slate-300"
            />
            Aktif (yeni zincirlerde seçilebilir)
          </label>
        )}

        <div className="rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm text-slate-700">
          <p>
            <strong>{memberIds.length}</strong> üye seçildi
            {memberIds.length > 0 && (
              <>
                {" "}
                · Karar için en az <strong>{threshold}</strong> onay gerekir (salt çoğunluk)
              </>
            )}
          </p>
          {memberIds.length > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              Oy vermeyen üyeler çoğunluğa ulaşılmasını engeller.
            </p>
          )}
        </div>

        {selectedUsers.length > 0 && (
          <div>
            <p className="input-label">Seçili üyeler</p>
            <ul className="flex flex-wrap gap-2">
              {selectedUsers.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    className="chip flex items-center gap-1 bg-white"
                    onClick={() => toggleMember(u.id)}
                  >
                    {u.firstName} {u.lastName}
                    <Icon name="close" size={12} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {canSearchUsers && (
          <div>
            <label className="input-label" htmlFor="member-search">
              Üye ekle
            </label>
            <input
              id="member-search"
              className="input-field"
              placeholder="Ad veya e-posta ile ara (en az 2 karakter)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {usersQuery.isLoading && <div className="skeleton mt-2 h-10 w-full" />}
            {candidates.length > 0 && (
              <ul className="mt-2 max-h-44 divide-y divide-slate-100 overflow-y-auto rounded-2xl border border-slate-100">
                {candidates.map((u) => {
                  const selected = memberIds.includes(u.id);
                  return (
                    <li key={u.id}>
                      <button
                        type="button"
                        className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left ${
                          selected ? "bg-brand-50" : "hover:bg-slate-50"
                        }`}
                        onClick={() => toggleMember(u.id)}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="truncate text-xs text-slate-400">{u.email}</p>
                        </div>
                        {selected && <Icon name="check" size={14} className="text-brand-600" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}
