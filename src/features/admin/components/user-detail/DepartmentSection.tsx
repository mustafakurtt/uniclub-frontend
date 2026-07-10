// Bölüm ataması — `user.manage`. Bölüm her zaman fakülte zinciriyle seçilir.
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { updateUserDepartment } from "@/features/admin/api";
import { getDepartments, getFaculties } from "@/features/universities/api/universities";
import type { AdminUserDetail } from "@/shared/types";
import MutationError from "./MutationError";
import { useInvalidateUserDetail } from "./useUserDetail";

interface Props {
  universityId: string;
  user: AdminUserDetail;
}

export default function DepartmentSection({ universityId, user }: Props) {
  const invalidate = useInvalidateUserDetail(universityId, user.id);
  const [facultyId, setFacultyId] = useState("");
  const [pendingDept, setPendingDept] = useState<string | null>(null);

  const facultiesQuery = useQuery({
    queryKey: ["university", universityId, "faculties"],
    queryFn: () => getFaculties(universityId),
  });

  const departmentsQuery = useQuery({
    queryKey: ["university", universityId, "faculty", facultyId, "departments"],
    queryFn: () => getDepartments(universityId, facultyId),
    enabled: !!facultyId,
  });

  const deptMutation = useMutation({
    mutationFn: (departmentId: string | null) =>
      updateUserDepartment(universityId, user.id, departmentId),
    onSuccess: () => {
      invalidate();
      setFacultyId("");
      setPendingDept(null);
    },
  });

  return (
    <section>
      <MutationError error={deptMutation.error} />
      <h3 className="input-label">Bölüm</h3>
      <p className="mb-2 text-xs text-slate-500">
        Mevcut:{" "}
        <span className="font-semibold text-slate-700">
          {user.departmentId ? "Atanmış" : "Atanmamış"}
        </span>{" "}
        — fakülte ve bölüm seçerek güncelleyin.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="select-field w-auto text-sm"
          value={facultyId}
          onChange={(e) => {
            setFacultyId(e.target.value);
            setPendingDept(null);
          }}
          aria-label="Fakülte"
        >
          <option value="">Fakülte seç…</option>
          {(facultiesQuery.data ?? []).map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <select
          className="select-field w-auto text-sm"
          value={pendingDept ?? ""}
          disabled={!facultyId || departmentsQuery.isLoading}
          onChange={(e) => setPendingDept(e.target.value || null)}
          aria-label="Bölüm"
        >
          <option value="">Bölüm seç…</option>
          {(departmentsQuery.data ?? []).map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <button
          className="btn-secondary px-3 py-1.5 text-xs"
          disabled={!pendingDept || deptMutation.isPending}
          onClick={() => pendingDept && deptMutation.mutate(pendingDept)}
        >
          Ata
        </button>
        {user.departmentId && (
          <button
            className="btn-ghost px-3 py-1.5 text-xs text-slate-400 hover:text-red-600"
            disabled={deptMutation.isPending}
            onClick={() => deptMutation.mutate(null)}
          >
            Bölümü Kaldır
          </button>
        )}
      </div>
    </section>
  );
}
