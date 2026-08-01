import { Link } from "react-router-dom";
import { Icon } from "@/shared/ui/Icon";

interface ActivityCheckInActionsProps {
  clubId: string;
  activityId: string;
  published: boolean;
}

/** Host staff yoklama giriş noktaları — modal içinden ayrı dosya (~250 satır kuralı). */
export default function ActivityCheckInActions({
  clubId,
  activityId,
  published,
}: ActivityCheckInActionsProps) {
  if (!published) return null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
      <h4 className="font-display text-sm font-bold text-slate-900">Yoklama QR</h4>
      <p className="mt-1 text-xs text-slate-500">
        Projeksiyona yansıtılacak dönen QR kodu. Öğrenciler telefonlarıyla okutarak katılım
        işaretler.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          to={`/clubs/${clubId}/activities/${activityId}/yoklama-qr`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-xs"
        >
          <Icon name="members" size={14} /> Yoklama Başlat
        </Link>
      </div>
    </div>
  );
}
