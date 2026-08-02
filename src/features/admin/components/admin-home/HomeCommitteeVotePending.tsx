import { Link } from "react-router-dom";
import CommitteePendingApplicationsList from "@/features/admin/components/CommitteePendingApplicationsList";
import { useAdminHomeBlockVisibility } from "@/features/admin/components/admin-home/AdminHomeBlocksContext";
import { useMyCommitteePendingApplications } from "@/features/admin/hooks/useMyCommitteePending";
import { Icon } from "@/shared/ui/Icon";

interface HomeCommitteeVotePendingProps {
  universityId: string;
}

/**
 * Kurul üyesine oy bekleyen başvurular — GET .../my-committee-pending.
 */
export default function HomeCommitteeVotePending({ universityId }: HomeCommitteeVotePendingProps) {
  const pending = useMyCommitteePendingApplications(universityId);

  const visible = pending.access === "ok" && pending.items.length > 0;

  useAdminHomeBlockVisibility(
    "committee-votes",
    pending.access === "loading"
      ? "loading"
      : visible
        ? "visible"
        : "hidden",
  );

  if (!visible) {
    return null;
  }

  return (
    <section className="card border-violet-100 bg-violet-50/40 p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="icon-tile shrink-0">
            <Icon name="pending" size={22} className="text-violet-600" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Oyunuzu bekleyen başvurular
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Kurul kademesindeki başvurularda salt çoğunluk için oyunuz gerekiyor.
            </p>
          </div>
        </div>
        <Link to="/admin/committee-tasks" className="btn-secondary text-sm">
          Tümünü gör ({pending.items.length})
        </Link>
      </div>

      <CommitteePendingApplicationsList items={pending.items} />
    </section>
  );
}
