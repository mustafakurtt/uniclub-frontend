import { NavLink } from "react-router-dom";
import { useAdminScope } from "@/features/admin/context/AdminScopeContext";
import { useMyCommitteePendingApplications } from "@/features/admin/hooks/useMyCommitteePending";
import { Icon } from "@/shared/ui/Icon";

interface CommitteeTasksNavItemProps {
  navLinkClass: ({ isActive }: { isActive: boolean }) => string;
}

export default function CommitteeTasksNavItem({ navLinkClass }: CommitteeTasksNavItemProps) {
  const { universityId } = useAdminScope();
  const pending = useMyCommitteePendingApplications(universityId);

  if (pending.access !== "ok" || pending.items.length === 0) {
    return null;
  }

  return (
    <NavLink to="/admin/committee-tasks" className={navLinkClass}>
      {({ isActive }) => (
        <>
          <Icon name="pending" size={18} />
          <span className="flex-1">Kurul Görevlerim</span>
          <span
            className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
              isActive ? "bg-white/20 text-white" : "bg-amber-500 text-white"
            }`}
          >
            {pending.items.length}
          </span>
        </>
      )}
    </NavLink>
  );
}
