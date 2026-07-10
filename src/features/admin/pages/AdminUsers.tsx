import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getAdminUsers } from "@/features/admin/api";
import { getErrorMessage } from "@/shared/api/client";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import UserDetailModal from "@/features/admin/components/user-detail/UserDetailModal";
import RequireUniversity from "@/features/admin/components/RequireUniversity";
import { useRankActor } from "@/features/admin/useRankActor";
import { canManageUser, outrankedReason, rankOf, selfActionReason } from "@/features/admin/rank";
import {
  roleLabel,
  USER_STATUS_LABELS,
  USER_STATUS_CHIP_CLASSES,
} from "@/features/admin/labels";
import type { RoleName, UserStatus } from "@/shared/types";

// Kullanıcı yönetimi (docs/FRONTEND_YONETIM.md §5.1) — okuma `user.view`.
// Liste `?status=` ve `?role=` ile filtrelenir; satıra tıklayınca detay modalı
// açılır (durum/bölüm/rol/claim — hepsi kendi granüler yetkisiyle).
//
// Rütbe (FRONTEND_RUTBE_VE_PLATFORM.md §4): aktör yalnızca KENDİNDEN DÜŞÜK
// rütbeli kullanıcıya dokunabilir. Dokunamayacağı satırlar listede kilit
// rozetiyle işaretlenir — satır yine açılır, çünkü görüntüleme serbesttir.

const STATUS_FILTERS: { key: UserStatus | "all"; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "active", label: "Aktif" },
  { key: "pending", label: "Bekleyen" },
  { key: "suspended", label: "Askıda" },
];

// Filtre için sık kullanılan seed rolleri (backend serbest rol adı kabul eder;
// bu yalnızca kolay filtreleme içindir).
const ROLE_FILTERS: RoleName[] = [
  "university_admin",
  "student_affairs",
  "academic_affairs",
  "content_moderator",
  "auditor",
  "advisor",
  "student",
];

function UsersList({ universityId }: { universityId: string }) {
  const actor = useRankActor();
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [roleFilter, setRoleFilter] = useState<RoleName | "">("");
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["admin", universityId, "users", { status: statusFilter, role: roleFilter }],
    queryFn: () =>
      getAdminUsers(universityId, {
        status: statusFilter === "all" ? undefined : statusFilter,
        role: roleFilter || undefined,
      }),
  });

  const query = search.trim().toLocaleLowerCase("tr-TR");
  const users = useMemo(() => {
    const rows = usersQuery.data ?? [];
    if (query.length < 2) return rows;
    return rows.filter((u) =>
      `${u.firstName} ${u.lastName} ${u.email}`.toLocaleLowerCase("tr-TR").includes(query)
    );
  }, [usersQuery.data, query]);

  return (
    <div className="space-y-6">
      {/* Filtreler */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                statusFilter === f.key
                  ? "bg-brand-600 text-white shadow-glow"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-brand-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          className="select-field w-auto py-1.5 text-xs font-semibold text-slate-600"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleName | "")}
          aria-label="Role göre filtrele"
        >
          <option value="">Tüm roller</option>
          {ROLE_FILTERS.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field max-w-xs py-1.5 text-sm"
          placeholder="Ad ya da e-posta ara…"
        />
      </div>

      {/* Liste */}
      {usersQuery.isLoading ? (
        <div className="space-y-3">
          <div className="skeleton h-16 w-full" />
          <div className="skeleton h-16 w-full" />
          <div className="skeleton h-16 w-full" />
        </div>
      ) : usersQuery.isError ? (
        <div className="alert-error">{getErrorMessage(usersQuery.error, "Kullanıcılar yüklenemedi.")}</div>
      ) : users.length === 0 ? (
        <EmptyState icon="members" title="Bu filtrede kullanıcı yok" />
      ) : (
        <div className="card overflow-hidden p-0">
          <ul className="divide-y divide-slate-100">
            {users.map((u) => {
              const isSelf = u.id === actor.userId;
              const manageable = canManageUser(actor, u);
              return (
                <li key={u.id}>
                  <button
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-50/50"
                    onClick={() => setSelectedUserId(u.id)}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-600 to-accent-400 text-sm font-bold text-white">
                      {u.photoUrl ? (
                        <img src={u.photoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (u.firstName[0] ?? "?").toLocaleUpperCase("tr-TR")
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-sm font-bold text-slate-900">
                        {u.firstName} {u.lastName}
                        {isSelf && (
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                            SEN
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-slate-400">{u.email}</p>
                    </div>

                    {/* Rütbe engeli — aksiyonların neden kapalı olacağını önden söyler */}
                    {!manageable && (
                      <span
                        title={isSelf ? selfActionReason : outrankedReason}
                        aria-label={isSelf ? selfActionReason : outrankedReason}
                        className="shrink-0 text-slate-300"
                      >
                        <Icon name="lock" size={14} aria-hidden={false} />
                      </span>
                    )}

                    <div className="hidden shrink-0 flex-wrap justify-end gap-1 sm:flex">
                      {u.roles
                        .filter((r) => r.name !== "student")
                        .slice(0, 3)
                        .map((r) => (
                          <span
                            key={r.id}
                            className="rounded-full border border-brand-100 bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700"
                            title={`Rütbe ${r.rank}`}
                          >
                            {roleLabel(r.name)}
                          </span>
                        ))}
                    </div>
                    <span
                      className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${USER_STATUS_CHIP_CLASSES[u.status]}`}
                    >
                      {USER_STATUS_LABELS[u.status]}
                    </span>
                    <span className="hidden shrink-0 text-[11px] font-semibold text-slate-300 lg:inline">
                      #{rankOf(u.roles)}
                    </span>
                    <Icon name="chevronRight" size={16} className="shrink-0 text-slate-300" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <UserDetailModal
        open={!!selectedUserId}
        universityId={universityId}
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  );
}

export default function AdminUsers() {
  const { hasPermission } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Kullanıcılar</h1>
        <p className="mt-1 text-sm text-slate-500">
          Durum, bölüm, rol ve kişisel yetkileri yönetin. Kullanıcı silme yoktur — askıya alın.
        </p>
      </div>

      {!hasPermission("user.view") ? (
        <div className="alert-error">Kullanıcıları görüntüleme yetkin bulunmuyor.</div>
      ) : (
        <RequireUniversity>
          {(universityId) => <UsersList universityId={universityId} />}
        </RequireUniversity>
      )}
    </div>
  );
}
